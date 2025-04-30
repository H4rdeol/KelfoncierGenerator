/*
** EPITECH PROJECT, 2024
** SPVE_App
** File description:
** lib.rs
*/

mod download;

use std::{fs, path::PathBuf};
use std::process::Command;
use serde::Deserialize;
use tauri::{AppHandle, Emitter, Manager};
use tokio::task;
use download::{ get_directory, get_kelfoncier_files };

#[derive(Deserialize, Debug)]
struct FormData {
    filename: String,
    directory: String,
    dep: String
}

#[tauri::command(async)]
fn print_files(app_handle: AppHandle, files: Vec<String>, name: String) -> Result<(), String> {
    let path = get_directory(&app_handle, name)?;

    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    task::spawn_blocking(move || {
        for src in files {
            let path_buf = PathBuf::from(&src);
            let filename = path_buf
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown");
            let dest = path.join(filename);
            if let Err(e) = fs::copy(&src, &dest) {
                eprintln!("Échec copie {} → {} : {}", src, dest.display(), e);
            }
        }

        if let Err(e) = app_handle.emit("files_saved", ()) {
            eprintln!("Erreur emit files_saved : {}", e);
        }
    });

    Ok(())
}

#[tauri::command]
fn get_files(app_handle: AppHandle, dir_name: String) -> Result<Vec<String>, String> {
    let path = get_directory(&app_handle, dir_name).map_err(|e| e.to_string())?;

    if !path.exists() {
        return Err("Config directory does not exist".to_string());
    }

    let mut files = vec![];
    for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.file_type().map_err(|e| e.to_string())?.is_file() {
            files.push(entry.file_name().to_string_lossy().to_string());
        }
    }
    Ok(files)
}

#[tauri::command]
fn remove_file(app_handle: AppHandle, filename: String, dir_name: String) -> Result<(), String> {
    let path = get_directory(&app_handle, dir_name).map_err(|e| e.to_string())?;

    let filepath = path.join(&filename);
    fs::remove_file(filepath).map_err(|e| e.to_string())?;
    app_handle
        .emit("files_saved", "File deleted successfully")
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_all_files(app_handle: AppHandle, dir_name: String) -> Result<(), String> {
    let path = get_directory(&app_handle, dir_name).map_err(|e| e.to_string())?;

    if !path.exists() {
        return Err("Config directory does not exist".to_string());
    }

    for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.file_type().map_err(|e| e.to_string())?.is_file() {
            fs::remove_file(entry.path()).map_err(|e| e.to_string())?;
        }
    }
    app_handle
        .emit("files_saved", "Files deleted successfully")
        .map_err(|e| e.to_string())
}

fn verif_departments(dep: String) -> Option<Vec<String>> {
    const DEPARTMENTS: [&str; 101] = [
        "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
        "11", "12", "13", "14", "15", "16", "17", "18", "19", "21",
        "22", "23", "24", "25", "26", "27", "28", "29", "30", "31",
        "32", "33", "34", "35", "36", "37", "38", "39", "40", "41",
        "42", "43", "44", "45", "46", "47", "48", "49", "50", "51",
        "52", "53", "54", "55", "56", "57", "58", "59", "60", "61",
        "62", "63", "64", "65", "66", "67", "68", "69", "70", "71",
        "72", "73", "74", "75", "76", "77", "78", "79", "80", "81",
        "82", "83", "84", "85", "86", "87", "88", "89", "90", "91",
        "92", "93", "94", "95", "2A", "2B", "971", "972", "973", "974", "976"
    ];
    let mut res: Vec<String> = Vec::new();

    if dep.is_empty() {
        for dep in DEPARTMENTS {
            res.push(dep.to_string());
        }
        return Some(res);
    }
    let deps: Vec<&str> = dep
        .split(|c| c == ',' || c == ' ')
        .filter_map(|s| {
            let timed = s.trim();
            if timed.is_empty() { None } else { Some(timed) }
        })
        .collect();
    for dep in deps {
        if !DEPARTMENTS.contains(&dep) {
            return None;
        }
        res.push(dep.to_string());
    }
    Some(res)
}

fn handle_kelfoncier_files(path: PathBuf, app_handle: AppHandle, department_code: String) {
   if !path.exists() {
        if let Err(err) = fs::create_dir_all(path.clone()) {
            println!("Failed to create directory: {}", err);
            return;
        }
    }
    let files = fs::read_dir(path).unwrap().filter_map( |entry | {
            entry.ok()
        }).map(| entry | {
            entry.path().to_str().unwrap().to_string()
        }).collect::<Vec<_>>();
    if files.len() == 0 {
        if let Err(e) = get_kelfoncier_files(&app_handle, department_code) {
            eprintln!("Error downloading kelfoncier files: {}", e);
        }
    }
}

fn launch_generation(
    directory: String, file: String, app_handle: AppHandle, department_code: String) -> Result<(), String> {
    let base_path = match app_handle.path().app_data_dir() {
        Ok(path) => path,
        Err(e) => return Err(format!("Failed to get app data directory: {}", e))
    };
    let script_path = app_handle
        .path()
        .resource_dir()
        .unwrap()
        .join("resources/scripts/generation.py");
    let output = Command::new("python3")
        .args([
            script_path.to_str().unwrap().to_string(),
            directory,
            file,
            base_path.to_str().unwrap().to_string(),
            department_code
        ])
        .output()
        .map_err(|e| { e.to_string() })?;

    if String::from_utf8_lossy(&output.stderr) != "" {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}

#[tauri::command(async)]
fn generate(app_handle: AppHandle, form_data: FormData) -> Result<(), String> {
    let path = get_directory(&app_handle, "kelfoncier".to_string())?;

    if form_data.directory.is_empty() {
        return Err("Un des champs obligatoire est vide".to_string());
    }
    let Some(departments) = verif_departments(form_data.dep) else {
        return Err("Invalid department {form_data.dep}".to_string());
    };

    let app_handle_clone = app_handle.clone();
    for dep in departments {
        let filename = if form_data.filename.is_empty() { dep.clone() } else { form_data.filename.clone() };
        handle_kelfoncier_files(path.clone(), app_handle_clone.clone(), dep.clone());
        if let Err(e) = launch_generation(form_data.directory.clone(), filename, app_handle_clone.clone(),
            dep
        ) {
            eprintln!("{}", e);
            return Err(e);
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            print_files,
            get_files,
            remove_file,
            remove_all_files,
            generate
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
