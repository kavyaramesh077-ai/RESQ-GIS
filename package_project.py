import os
import zipfile

def create_project_zip():
    output_filename = "ResQ-GIS-SIH-READY.zip"
    exclude_dirs = {"node_modules", "dist", ".git", "__pycache__", ".vscode", "venv"}
    exclude_files = {output_filename, "package-lock.json", ".DS_Store"}

    print(f"[Packaging] Compiling complete project into {output_filename}...")
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("."):
            # Exclude unwanted directories in-place
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            for file in files:
                if file in exclude_files or file.endswith('.pyc'):
                    continue
                file_path = os.path.join(root, file)
                # Store relative path inside zip
                arcname = os.path.relpath(file_path, ".")
                zipf.write(file_path, arcname)

    size_mb = os.path.getsize(output_filename) / (1024 * 1024)
    print(f"[Packaging] Successfully generated {output_filename} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    create_project_zip()
