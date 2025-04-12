import json
import base64
import os

def obfuscate_json(input_folder, output_folder):
    """
    Obfuscate all JSON files in the given input folder using Base64 encoding,
    and save the results to the output folder with the same filenames.

    Parameters:
    - input_folder: Path to the folder containing original JSON files
    - output_folder: Path to the folder for saving obfuscated JSON files
    """
    # Ensure the output folder exists
    os.makedirs(output_folder, exist_ok=True)

    # Get all JSON files in the input folder
    json_files = [f for f in os.listdir(input_folder) if f.endswith('.json')]
    
    if not json_files:
        print(f"Error: No .json files found in {input_folder}")
        return

    for json_file in json_files:
        input_path = os.path.join(input_folder, json_file)
        output_path = os.path.join(output_folder, json_file)

        # Read the original JSON file
        try:
            with open(input_path, 'r', encoding='utf-8') as f:
                corpus = json.load(f)
        except FileNotFoundError:
            print(f"Error: File {input_path} not found. Please check the path!")
            continue
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON format in {input_path}. Please check the syntax!")
            continue

        try:
            # Convert JSON data to string
            corpus_str = json.dumps(corpus, ensure_ascii=False)

            # Encode to Base64
            obfuscated = base64.b64encode(corpus_str.encode('utf-8')).decode('utf-8')

            # Save to output folder, keeping the original filename
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(obfuscated)

            print(f"Obfuscated file created: {output_path}")

            # Optional: Verify by decoding
            with open(output_path, 'r', encoding='utf-8') as f:
                obfuscated_content = f.read()
            decoded = base64.b64decode(obfuscated_content).decode('utf-8')
            print(f"Verification for {json_file} (first 100 characters): {decoded[:100]}...")

        except Exception as e:
            print(f"Failed to process {json_file}: {str(e)}")

# Example usage
input_folder = r'Input_folder_path'       # Input folder path
output_folder = r'Output_folder_path'  # Output folder path

obfuscate_json(input_folder, output_folder)
