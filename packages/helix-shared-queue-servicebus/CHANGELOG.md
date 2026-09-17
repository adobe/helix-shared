# [@adobe/helix-shared-queue-servicebus-v2.1.0](https://github.com/adobe/helix-shared/compare/@adobe/helix-shared-queue-servicebus-v2.0.0...@adobe/helix-shared-queue-servicebus-v2.1.0) (2026-09-17)


### Features

* **queue-servicebus:** support AMQP-over-WebSocket transport ([#1283](https://github.com/adobe/helix-shared/issues/1283)) ([4c6a4c4](https://github.com/adobe/helix-shared/commit/4c6a4c497e6d2ac8121317149a5b28658477b933)), closes [#1282](https://github.com/adobe/helix-shared/issues/1282)

# [@adobe/helix-shared-queue-servicebus-v2.0.0](https://github.com/adobe/helix-shared/compare/@adobe/helix-shared-queue-servicebus-v1.1.0...@adobe/helix-shared-queue-servicebus-v2.0.0) (2026-09-15)


### Features

* **queue:** move isSwapped()/deserialize() to QueueService, backed by Storage ([#1280](https://github.com/adobe/helix-shared/issues/1280)) ([f02cb94](https://github.com/adobe/helix-shared/commit/f02cb94d5c1bfb8abcdbe30d791928e1c77c1e06)), closes [isSwapped/QueueService#deserialize](https://github.com/isSwapped/QueueService/issues/deserialize)


### BREAKING CHANGES

* **queue:** Queue#isSwapped/Queue#deserialize have been removed. Use

# [@adobe/helix-shared-queue-servicebus-v1.1.0](https://github.com/adobe/helix-shared/compare/@adobe/helix-shared-queue-servicebus-v1.0.0...@adobe/helix-shared-queue-servicebus-v1.1.0) (2026-09-14)


### Features

* **queue:** add toReceivedMessages() for messages delivered outside receive() ([#1278](https://github.com/adobe/helix-shared/issues/1278)) ([03558db](https://github.com/adobe/helix-shared/commit/03558dbbeaf98e3d768e69643cc218db6c5a923b))

# @adobe/helix-shared-queue-servicebus-v1.0.0 (2026-09-11)


### Features

* **queue-servicebus:** add Azure Service Bus queue backend ([#1275](https://github.com/adobe/helix-shared/issues/1275)) ([d965398](https://github.com/adobe/helix-shared/commit/d96539861483703340082bc7997684042f996e14))
