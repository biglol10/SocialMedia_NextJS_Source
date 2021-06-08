const users = [];

const addUser = async (userId, socketId) => {
  // check if we have a user connected with this userId
  const user = users.find((user) => user.userId === userId);

  // if there is a user in users array, which means user is connected already then check socketId
  if (user && user.socketId === socketId) {
    return users;
  }
  // if socketId is not equal, remove and create new (when you refresh this makes sure there are no duplicates, so user has a unique socketID)
  else {
    if (user && user.socketId !== socketId) {
      await removeUser(user.socketId);
    }

    const newUser = { userId, socketId }; // ES6 syntax

    users.push(newUser);

    return users;
  }
};

const removeUser = async (socketId) => {
  const indexOf = users.map((user) => user.socketId).indexOf(socketId);

  await users.splice(indexOf, 1);

  return;
};

const findConnectedUser = (userId) =>
  users.find((user) => user.userId === userId);

module.exports = { addUser, removeUser, findConnectedUser };
