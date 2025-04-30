fn main() {
    println!("cargo:rerun-if-env-changed=API_KEY");
    println!("cargo:rerun-if-env-changed=EMAIL");
    println!("cargo:rerun-if-env-changed=PASSWORD");

    if let Ok(key) = std::env::var("API_KEY") {
        println!("cargo:rustc-env=API_KEY={}", key);
    }
    if let Ok(email) = std::env::var("EMAIL") {
        println!("cargo:rustc-env=EMAIL={}", email);
    }
    if let Ok(pw) = std::env::var("PASSWORD") {
        println!("cargo:rustc-env=PASSWORD={}", pw);
    }
    tauri_build::build()
}
