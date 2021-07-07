class ABC():
    class_id = 1

    def __init__(self, x: int, y: int):
        self.x = x
        self.y = y
    
    def arithmetic(self):
        return self.x + self.y
    
    def increment(self, val):
        self.x += val
        self.y += val

def merge_abc(abc1, abc2):
    return ABC(abc1.x + abc2.x, abc1.y + abc2.y)

def identity(abc: ABC):
    return abc