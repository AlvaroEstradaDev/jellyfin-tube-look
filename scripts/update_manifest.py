#!/usr/bin/env python3
import json
import sys
import os
import hashlib
from datetime import datetime, timezone

def calculate_md5(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def update_manifest(manifest_path, version, target_abi, changelog, zip_file_path, base_url):
    try:
        with open(manifest_path, 'r') as f:
            manifest_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {manifest_path} not found.")
        sys.exit(1)
        
    plugin_entry = manifest_data[0]
    
    zip_filename = os.path.basename(zip_file_path)
    # E.g. https://github.com/AlvaroEstradaDev/jellyfin-tube-look/releases/download/v1.0.0/Release-...zip
    source_url = f"{base_url}/releases/download/{version}/{zip_filename}"
    checksum = calculate_md5(zip_file_path)
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    
    new_version = {
        "version": version.lstrip('v'),
        "changelog": changelog,
        "targetAbi": target_abi,
        "sourceUrl": source_url,
        "checksum": checksum,
        "timestamp": timestamp
    }
    
    if "versions" not in plugin_entry:
        plugin_entry["versions"] = []
    
    # Remove older entry if same version & targetAbi exists
    plugin_entry["versions"] = [v for v in plugin_entry["versions"] 
                                if not (v.get("version") == new_version["version"] and v.get("targetAbi") == new_version["targetAbi"])]
    
    plugin_entry["versions"].insert(0, new_version)
    
    with open(manifest_path, 'w') as f:
        json.dump(manifest_data, f, indent=4)
        print(f"Successfully added version {new_version['version']} ({target_abi}) to {manifest_path}")

if __name__ == "__main__":
    if len(sys.argv) != 7:
        print("Usage: python3 update_manifest.py <manifest_path> <version> <target_abi> <changelog> <zip_file_path> <repo_base_url>")
        sys.exit(1)
        
    update_manifest(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6])
