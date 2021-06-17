from flask import Flask, render_template, request, json
from type4py.infer import PretrainedType4Py, type_annotate_file
app = Flask(__name__)

t4py_pretrained_m = None

@app.route('/')
def hello_world():
    return render_template('index.html')

@app.before_first_request
def load_type4py_model():
    global t4py_pretrained_m
    t4py_pretrained_m =  PretrainedType4Py("/home/amir/MT4Py_typed_full/type4py_pretrained/")
    t4py_pretrained_m.load_pretrained_model()

@app.route('/predict', methods = ['POST', 'GET'])
def upload():
    """
    POST method for uploading a file. Reads in a sent file and returns it.
    TODO: modify to your own needs
    """
    global t4py_pretrained_m

    src_file = request.data
    print("TC", request.args.get("tc"))
    #type_annotate_file(t4py_pretrained_m, src_file, None)
    return type_annotate_file(t4py_pretrained_m, src_file, None)