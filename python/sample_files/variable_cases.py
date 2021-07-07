class A():
    var1 = {'key': 1}

    def __init__(self):
        pass
    
    def access(self):
        return self.var1

def foo():
    var1 = [12, 45]
    foo_var = 94
    var1.append(foo_var)
    return var1


var1 = "x"
var2 = 123
