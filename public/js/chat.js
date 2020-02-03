const socket = io();

const messageForm = document.querySelector("#message-form");
const messageInput = messageForm.querySelector("input");
const messageBtn = messageForm.querySelector("button");
const sendLocationBtn = document.querySelector("#send-location");
const messages = document.querySelector("#messages");
const sidebar = document.querySelector("#sidebar");

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoScroll = () => {
  // New message element
  const newMessage = messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = messages.offsetHeight;

  // Height of messages container
  const containerHeight = messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = messages.scrollTop + visibleHeight;

  // Error margin
  const errorMargin = 5;

  if (containerHeight - newMessageHeight - errorMargin <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  sidebar.innerHTML = html;
});

socket.on("message", ({ text, username, createdAt }) => {
  const html = Mustache.render(messageTemplate, {
    username,
    text,
    createdAt: moment(createdAt).format("hh:mm a")
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", ({ url, username, createdAt }) => {
  const html = Mustache.render(locationTemplate, {
    username,
    url,
    createdAt: moment(createdAt).format("hh:mm a")
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

messageForm.addEventListener("submit", e => {
  e.preventDefault();

  messageBtn.setAttribute("disabled", "disabled");

  const msg = messageInput.value;
  socket.emit("sendMessage", msg, error => {
    messageBtn.removeAttribute("disabled");
    messageInput.value = "";
    messageInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log("The message was delivered!");
  });
});

sendLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Your browser doesn't support geolocation");
  }

  sendLocationBtn.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    socket.emit("sendLocation", { latitude, longitude }, error => {
      sendLocationBtn.removeAttribute("disabled");

      if (error) {
        return console.log(error);
      }
      console.log("Location shared!");
    });
  });
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
