from flask import Flask, render_template, request, send_file, url_for
import pandas as pd
import os
import uuid

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return "No file part", 400
    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400

    try:
        df = pd.read_csv(file)

        # Identify duplicates across all columns (mark all occurrences)
        duplicates_df = df[df.duplicated(keep=False)]

        duplicates_file = None
        if not duplicates_df.empty:
            # Persist duplicates as a temporary CSV for later download
            token = uuid.uuid4().hex
            filename = f"duplicates_{token}.csv"
            output_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            duplicates_df.to_csv(output_path, index=False)
            duplicates_file = filename

        return render_template(
            'results.html',
            original_data=df.to_html(classes='table table-striped', index=False),
            duplicate_data=duplicates_df.to_html(classes='table table-striped', index=False) if not duplicates_df.empty else None,
            has_duplicates=not duplicates_df.empty,
            duplicates_file=duplicates_file,
        )
    except Exception as e:
        return f"Error processing file: {e}", 500


@app.route('/download_duplicates', methods=['GET'])
def download_duplicates():
    # Expect a query parameter 'file' that references the temp duplicates CSV
    file_name = request.args.get('file')
    if not file_name:
        return "Missing file parameter", 400

    # Very simple validation to avoid path traversal and ensure expected naming
    if ('/' in file_name) or ('\\' in file_name) or (not file_name.startswith('duplicates_')) or (not file_name.endswith('.csv')):
        return "Invalid file parameter", 400

    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name)
    if not os.path.isfile(file_path):
        return "File not found or expired", 404

    return send_file(file_path, mimetype='text/csv', as_attachment=True, download_name='duplicates.csv')


if __name__ == '__main__':
    app.run(debug=True)


