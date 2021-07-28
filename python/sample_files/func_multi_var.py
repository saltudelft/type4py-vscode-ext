class A():
    def __init__(self):
        x = 1
    
    def sign(self, y):
        if y < 0:
            sign = "-"
        elif y == 0:
            sign = ""
        else:
            sign = "+"
        
        return sign

def fun(a):
    if a:
        x = 1
    else:
        x = 3
    
    return x