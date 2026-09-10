self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || "Webberick", {
    body: data.body || "You have a new Webberick update.",
    icon: "/webberick-favicon.svg",
    badge: "/webberick-favicon.svg",
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/admin"));
});
