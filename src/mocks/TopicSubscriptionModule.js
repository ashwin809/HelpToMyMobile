// Mock for ExpoTopicSubscriptionModule in Expo Go / Emulators
const mockModule = {
  subscribeToTopicAsync: async () => null,
  unsubscribeFromTopicAsync: async () => null,
};

module.exports = mockModule;
module.exports.default = mockModule;
