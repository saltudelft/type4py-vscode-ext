from flask import Flask, render_template, request, json, Blueprint
from type4py.infer import PretrainedType4Py, type_annotate_file, get_type_checked_preds

app = Flask(__name__)
bp = Blueprint('type4py_api', __name__, template_folder='templates', url_prefix="/api/")

t4py_pretrained_m = None

@bp.route('/')
def hello_world():
    return render_template('index.html')

@app.before_first_request
def load_type4py_model():
    global t4py_pretrained_m
    t4py_pretrained_m = PretrainedType4Py("/home/amir/MT4Py_typed_full/type4py_pretrained/")
    t4py_pretrained_m.load_pretrained_model()

@bp.route('/predict', methods = ['POST', 'GET'])
def upload():
    """
    POST method for uploading a file. Reads in a sent file and returns it.
    TODO: modify to your own needs
    """
    global t4py_pretrained_m
    src_file = request.data
    
    if bool(int(request.args.get("tc"))):
        print("Predictions with type-checking")
        return get_type_checked_preds(type_annotate_file(t4py_pretrained_m, src_file, None), src_file)
    else:
        print("Predictions without type-checking")
        return type_annotate_file(t4py_pretrained_m, src_file, None)

app.register_blueprint(bp)
