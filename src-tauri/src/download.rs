/*
** EPITECH PROJECT, 2024
** SPVE_App
** File description:
** download.rs
*/

use std::path::PathBuf;
use std::process::Command;
use std::thread::sleep;
use std::time::Duration;
use tauri::{ AppHandle, Emitter, Manager };
use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
use dotenvy::dotenv;
use std::env;

struct ScriptParameters {
    script_folder: String,
    store_folder: PathBuf,
    department_code: String
}

pub fn get_directory(app_handle: &AppHandle, name: String) -> Result<PathBuf, String> {
    let base_path = match app_handle.path().app_data_dir() {
        Ok(path) => path,
        Err(e) => return Err(format!("Failed to get app data directory: {}", e))
    };

    let path = base_path.join(name);
    Ok(path)
}

fn launch_downloader(parameters: ScriptParameters, app_handle: AppHandle) -> Result<(), String> {
    dotenv().ok();
    let ScriptParameters {script_folder, store_folder, department_code} = parameters;
    let stop_flag = Arc::new(AtomicBool::new(false));
    let stop_flag_clone = stop_flag.clone();
    let periodic_refresh = std::thread::spawn(move || {
        loop {
            if let Err(e) = app_handle.emit("files_saved", "file downloaded") {
                eprintln!("Failed to emit event: {}", e);
            }
            if stop_flag_clone.load(Ordering::Relaxed) {
                break;
            }
            sleep(Duration::from_secs(1));
        }

    });
    let output = Command::new(script_folder)
        .args([
            store_folder.to_str().unwrap().to_string(),
            department_code
        ])
        .env("EMAIL", env!("EMAIL"))
        .env("PASSWORD", env!("PASSWORD"))
        .env("API_KEY", env!("API_KEY"))
        .output()
        .expect("Failed to launch the downloader");

    stop_flag.store(true, Ordering::Relaxed);
    if let Err(_) = periodic_refresh.join() {
        eprintln!("Error during joining thread");
    }
    if String::from_utf8_lossy(&output.stderr) != "" {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    Ok(())
}

pub fn get_kelfoncier_files(app_handle: &AppHandle, department_code: String) -> Result<(), String> {
    let kelfoncier_path = match get_directory(app_handle, "kelfoncier".to_string()) {
        Ok(p) => {
            if !p.exists() {
                return Err("Path doesn't exist".to_string());
            }
            p
        }
        Err(e) => return Err(e),
    };
    let mut script_file = match std::env::consts::OS {
        "windows" => format!("find.exe"),
        "macos" => format!("find"),
        "linux" => format!("find"),
        _ => panic!("Unsupported OS"),
    };
    let script_path = app_handle
        .path()
        .resource_dir()
        .unwrap()
        .join("resources/scripts/")
        .join(script_file);
    let app_handle_clone = app_handle.clone();

    launch_downloader(
        ScriptParameters {
            script_folder: script_path.to_str().unwrap().to_string(),
            store_folder: kelfoncier_path,
            department_code: department_code
        },
        app_handle_clone
    )?;
    Ok(())
}
