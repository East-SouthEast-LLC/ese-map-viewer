# ==============================================================================
# CSV to JSON Converter Script
#
# Description:
# This script converts a specially formatted, semicolon-delimited CSV file
# into a JSON structure, designed for panoramic image pose data.
#
# Instructions:
# 1. Place this script in the same directory as your CSV file.
# 2. Make sure you have the pandas library installed. If not, run:
#    pip install pandas
# 3. Modify the 'USER_CONFIG' section below with your input file name and
#    the desired prefix for the output.
# 4. Run the script from your terminal:
#    python convert_data.py
#
# ==============================================================================

import pandas as pd
import json
import os

# ============================ USER_CONFIG =====================================
# --- MODIFY THESE VALUES ---

# The exact name of your input CSV file.
# Example: "GOHEEN_20250601.csv"

input_csv_file = input("Enter the name of your input CSV file: ")

# The prefix for the JSON keys. Make sure to include the trailing underscore.
# Example: "GOHEEN_20250601_"
output_prefix = input("Enter the desired prefix for the output JSON keys: ")
oputput_prefix = output_prefix.strip(' ')

# ------------------------------------------------------------------------------
# ==============================================================================


def convert_csv_to_json(csv_file, prefix):
    """
    Reads a semicolon-delimited CSV file and converts it to a
    custom-formatted JSON file.
    """
    # Generate the output filename from the prefix (e.g., "GOHEEN_20250601.json")
    output_json_file = f"{prefix.strip('_')}.json"

    # Check if the input file exists before proceeding
    if not os.path.exists(csv_file):
        print(f"❌ Error: Input file not found at '{csv_file}'")
        print("Please make sure the file is in the same directory as the script and the name is correct.")
        return

    print(f"▶️  Reading data from '{csv_file}'...")

    # Define the column names based on the CSV's header comment
    col_names = [
        'ID', 'filename', 'timestamp', 'pano_pos_x', 'pano_pos_y', 'pano_pos_z',
        'pano_ori_w', 'pano_ori_x', 'pano_ori_y', 'pano_ori_z'
    ]

    # Read the CSV data into a pandas DataFrame
    try:
        df = pd.read_csv(
            csv_file,
            sep=';',
            header=None,
            names=col_names,
            skiprows=1  # Skip the commented-out header line in the CSV
        )
    except Exception as e:
        print(f"❌ An error occurred while reading the CSV file: {e}")
        return

    # Create the main dictionary that will be converted to JSON
    json_data = {}

    print("⚙️  Processing data and building JSON structure...")

    # Iterate over each row in the DataFrame to build the JSON object
    for index, row in df.iterrows():
        try:
            # Extract the shot number (e.g., '00000-pano.jpg' -> '00000')
            shot_number = str(row['filename']).split('-')[0]

            # Create the main key for the JSON entry
            key = f"{prefix}{shot_number}.jpg"

            # Create the nested dictionary for the value, converting types
            value = {
                "id": int(row['ID']),
                "timestamp": float(row['timestamp']),
                "position": {
                    "x": float(row['pano_pos_x']),
                    "y": float(row['pano_pos_y']),
                    "z": float(row['pano_pos_z'])
                },
                "orientation": {
                    "w": float(row['pano_ori_w']),
                    "x": float(row['pano_ori_x']),
                    "y": float(row['pano_ori_y']),
                    "z": float(row['pano_ori_z'])
                }
            }
            # Add the new entry to our main dictionary
            json_data[key] = value
        except (ValueError, TypeError) as e:
            print(f"⚠️ Warning: Could not process row {index + 2}. Invalid data detected: {e}")
            continue


    print("💾 Formatting and saving JSON file...")

    # Create the custom formatted JSON string with compact sub-objects
    output_lines = []
    output_lines.append("{")

    keys = list(json_data.keys())
    for i, key in enumerate(keys):
        entry = json_data[key]

        # Use json.dumps to format the nested objects on a single line
        position_str = json.dumps(entry['position'])
        orientation_str = json.dumps(entry['orientation'])

        entry_lines = [
            f'  "{key}": {{',
            f'    "id": {entry["id"]},',
            f'    "timestamp": {entry["timestamp"]},',
            f'    "position": {position_str},',
            f'    "orientation": {orientation_str}',
            "  }"
        ]

        # Add a comma if it's not the last entry
        if i < len(keys) - 1:
            entry_lines[-1] += ","

        output_lines.extend(entry_lines)

    output_lines.append("}")

    final_json_string = "\n".join(output_lines)

    # Save the final string to a JSON file
    try:
        with open(output_json_file, 'w') as f:
            f.write(final_json_string)
        print(f"\n✅ Success! Conversion complete.")
        print(f"JSON file saved as: '{output_json_file}'")
    except Exception as e:
        print(f"❌ An error occurred while writing the JSON file: {e}")


if __name__ == "__main__":
    # Check if the user has updated the configuration variables
    if input_csv_file == "your_file_name.csv" or output_prefix == "YOUR_PREFIX_":
         print("✋ Please update the 'input_csv_file' and 'output_prefix' variables in the script before running.")
    else:
        convert_csv_to_json(input_csv_file, output_prefix)