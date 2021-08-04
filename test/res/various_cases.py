class A():
    t = 4

    def __init__(self, p):
        self.p = p
    
    def add(self, y):
        return (self.p + y)

def foo(x, y):
    a = 1
    return x + a + a*y

v = 5