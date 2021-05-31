from flask import Flask, render_template, request
app = Flask(__name__)

@app.route('/')
def hello_world():
    return render_template('index.html')

@app.route('/upload', methods = ['POST'])
def upload():
    """
    POST method for uploading a file. Reads in a sent file and returns it.
    TODO: modify to your own needs
    """
    # Get files from request
    files = request.files

    for f in files:
        # Get sent file
        sent_file = files[f]

        # Read source
        # TODO: Handle (potential) security issues
        source = sent_file.read()

        # TODO: handle file processing logic here

        # Only one file expected; return first
        return source
    
    return '?'