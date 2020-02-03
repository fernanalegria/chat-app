const generateMessage = (text, username) => ({
  username,
  text,
  createdAt: new Date().getTime()
});

const generateLocationMessage = (latitude, longitude, username) => ({
  username,
  url: `https://google.com/maps?q=${latitude},${longitude}`,
  createdAt: new Date().getTime()
});

module.exports = {
  generateMessage,
  generateLocationMessage
};
