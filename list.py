thislist = ["apple", "banana", "cherry"]
print(thislist[0]);

thislist = ["apple", "banana", "cherry", "orange", "kiwi", "melon", "mango"]
print(thislist[2:6]);

thislist = ["apple", "banana", "cherry", "orange", "kiwi", "melon", "mango"]
print(thislist[:4]);

thislist = ["apple", "banana", "cherry"]
thislist[0] = "blackcurrant"
print(thislist);

thislist = ["apple", "banana", "cherry", "orange", "kiwi", "mango"]
thislist[1:3] = ["blackcurrant", "watermelon"]
print(thislist);

thislist = ["apple", "banana", "cherry"]
thislist.append("aman")
print(thislist);

thislist = ["apple", "banana", "cherry"]
thislist.insert(0,"aman")
print(thislist);

thislist = ["apple", "banana", "cherry"]
thislist.remove("banana")
print(thislist);

thislist = ["apple", "banana", "cherry"]
i = 1
while i < len(thislist):
  print(thislist[i])
  i = i + 1;