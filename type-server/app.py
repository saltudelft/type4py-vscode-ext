from flask import Flask, render_template, request, Blueprint
from type4py.infer import PretrainedType4Py, type_annotate_file, get_type_checked_preds
import logging

app = Flask(__name__)
bp = Blueprint('type4py_api', __name__, template_folder='templates', url_prefix="/api/")

t4py_pretrained_m = None

class ServerResponse:
    def __init__(self, response: dict, error: str=None) -> None:
        self.response = response
        self.error = error
    
    def get(self):
        return {'response': self.response, 'error': self.error}


@bp.route('/')
def hello_world():
    return render_template('index.html')

@app.before_first_request
def load_type4py_model():
    global t4py_pretrained_m
    t4py_pretrained_m = PretrainedType4Py("/home/amir/MT4Py_typed_full/type4py_pretrained/")
    t4py_pretrained_m.load_pretrained_model()

@app.errorhandler(Exception)
def handle_exception(e):
    logging.exception(e)
    # or if you have logger configured
    # app.logger.exception(e)
    return "Internal Server Error", 500

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
        return ServerResponse(get_type_checked_preds(type_annotate_file(t4py_pretrained_m, src_file, None), src_file)).get()
    else:
        print("Predictions without type-checking")
        return ServerResponse(type_annotate_file(t4py_pretrained_m, src_file, None)).get()

app.register_blueprint(bp)
