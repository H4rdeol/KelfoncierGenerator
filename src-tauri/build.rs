fn main() {
    println!("cargo:rustc-env=EMAIL={}", std::env::var("EMAIL").unwrap());
    tauri_build::build()
}
