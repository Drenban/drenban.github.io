import pandas as pd
import json
import base64
import os
from datetime import datetime
import re

def get_latest_xlsx_file(input_folder):
    """
    Find the .xlsx file in the specified folder with the date closest to today.
    The filename must contain a date in the format like 'data_20230415.xlsx' or '2023-04-15_data.xlsx'.
    """
    today = datetime.now().date()
    xlsx_files = [f for f in os.listdir(input_folder) if f.endswith('.xlsx')]
    
    if not xlsx_files:
        raise FileNotFoundError(f"No .xlsx file found in {input_folder}")

    date_pattern = r'(\d{4}[-\._]\d{2}[-\._]\d{2})|(\d{8})'
    file_dates = []

    for file in xlsx_files:
        match = re.search(date_pattern, file)
        if match:
            date_str = match.group(0).replace('-', '').replace('_', '').replace('.', '')
            try:
                file_date = datetime.strptime(date_str, '%Y%m%d').date()
                days_diff = (today - file_date).days
                if days_diff >= 0:
                    file_dates.append((file, file_date, days_diff))
            except ValueError:
                continue
    
    if not file_dates:
        raise ValueError(f"No valid date found in .xlsx filenames in {input_folder}")

    latest_file = min(file_dates, key=lambda x: x[2])[0]
    return os.path.join(input_folder, latest_file)

def xlsx_to_json_and_obfuscate(input_folder, output_folder, sheet_name=None):
    """
    Convert the latest .xlsx file to JSON, save it with a date-named filename, and generate an obfuscated data.json file.
    Output is a single array, preserving leading zeros in the 'stock code' field.

    Parameters:
    - input_folder: Path to the input folder containing .xlsx files
    - output_folder: Path to the output folder for saving JSON and obfuscated files
    - sheet_name: Specific sheet name to read (optional); if None, use the first sheet
    """
    # Ensure output folder exists
    os.makedirs(output_folder, exist_ok=True)

    # Get the latest Excel file
    xlsx_file = get_latest_xlsx_file(input_folder)
    file_base_name = os.path.splitext(os.path.basename(xlsx_file))[0]
    json_file = os.path.join(output_folder, f"{file_base_name}.json")
    obfuscated_file = os.path.join(output_folder, 'data.json')

    try:
        # Read the Excel file, specifying 'stock code' column as string type
        dtype = {'股票代码': str}  # Force 'stock code' column to be string
        df = pd.read_excel(xlsx_file, sheet_name=sheet_name or 0, dtype=dtype)
        
        # Ensure 'stock code' is 6 digits with leading zeros
        if '股票代码' in df.columns:
            df['股票代码'] = df['股票代码'].apply(lambda x: str(x).zfill(6) if pd.notna(x) else None)
        
        # Replace NaN with None (null in JSON)
        df = df.replace({pd.NA: None, float('nan'): None})
        
        # Convert to list of records
        data = df.to_dict(orient='records')
        
        # Save to JSON file
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Sheet '{sheet_name or 'first sheet'}' converted from {xlsx_file} to {json_file}")

        # Read the generated JSON file and obfuscate
        with open(json_file, 'r', encoding='utf-8') as f:
            corpus = json.load(f)
        
        corpus_str = json.dumps(corpus, ensure_ascii=False)
        obfuscated = base64.b64encode(corpus_str.encode('utf-8')).decode('utf-8')

        # Save obfuscated data as data.json
        with open(obfuscated_file, 'w', encoding='utf-8') as f:
            f.write(obfuscated)
        print(f"Obfuscated file generated: {obfuscated_file}")

        # Optional: Verify obfuscated file
        with open(obfuscated_file, 'r', encoding='utf-8') as f:
            obfuscated_content = f.read()
        decoded = base64.b64decode(obfuscated_content).decode('utf-8')
        print(f"Decoded preview from obfuscated file:\n{decoded[:100]}...")

    except FileNotFoundError as e:
        print(f"Error: {str(e)}")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in {json_file}, please check the content!")
    except Exception as e:
        print(f"Conversion or obfuscation failed: {str(e)}")

# Usage example
input_folder = r'Input_folder_path'  # Input folder path
output_folder = r'Output_folder_path'  # Output folder path

xlsx_to_json_and_obfuscate(input_folder, output_folder)

# Example with a specific sheet
# xlsx_to_json_and_obfuscate(input_folder, output_folder, sheet_name='Sheet1')
