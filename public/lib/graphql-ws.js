"use strict";
var GraphQLWS = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // node_modules/graphql-ws/lib/utils.js
  var require_utils = __commonJS({
    "node_modules/graphql-ws/lib/utils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.limitCloseReason = exports.areGraphQLErrors = exports.isAsyncGenerator = exports.isAsyncIterable = exports.isObject = exports.extendedTypeof = void 0;
      function extendedTypeof(val) {
        if (val === null) {
          return "null";
        }
        if (Array.isArray(val)) {
          return "array";
        }
        return typeof val;
      }
      exports.extendedTypeof = extendedTypeof;
      function isObject(val) {
        return extendedTypeof(val) === "object";
      }
      exports.isObject = isObject;
      function isAsyncIterable(val) {
        return typeof Object(val)[Symbol.asyncIterator] === "function";
      }
      exports.isAsyncIterable = isAsyncIterable;
      function isAsyncGenerator(val) {
        return isObject(val) && typeof Object(val)[Symbol.asyncIterator] === "function" && typeof val.return === "function";
      }
      exports.isAsyncGenerator = isAsyncGenerator;
      function areGraphQLErrors(obj) {
        return Array.isArray(obj) && // must be at least one error
        obj.length > 0 && // error has at least a message
        obj.every((ob) => "message" in ob);
      }
      exports.areGraphQLErrors = areGraphQLErrors;
      function limitCloseReason(reason, whenTooLong) {
        return reason.length < 124 ? reason : whenTooLong;
      }
      exports.limitCloseReason = limitCloseReason;
    }
  });

  // node_modules/graphql-ws/lib/common.js
  var require_common = __commonJS({
    "node_modules/graphql-ws/lib/common.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.stringifyMessage = exports.parseMessage = exports.isMessage = exports.validateMessage = exports.MessageType = exports.CloseCode = exports.DEPRECATED_GRAPHQL_WS_PROTOCOL = exports.GRAPHQL_TRANSPORT_WS_PROTOCOL = void 0;
      var utils_1 = require_utils();
      exports.GRAPHQL_TRANSPORT_WS_PROTOCOL = "graphql-transport-ws";
      exports.DEPRECATED_GRAPHQL_WS_PROTOCOL = "graphql-ws";
      var CloseCode;
      (function(CloseCode2) {
        CloseCode2[CloseCode2["InternalServerError"] = 4500] = "InternalServerError";
        CloseCode2[CloseCode2["InternalClientError"] = 4005] = "InternalClientError";
        CloseCode2[CloseCode2["BadRequest"] = 4400] = "BadRequest";
        CloseCode2[CloseCode2["BadResponse"] = 4004] = "BadResponse";
        CloseCode2[CloseCode2["Unauthorized"] = 4401] = "Unauthorized";
        CloseCode2[CloseCode2["Forbidden"] = 4403] = "Forbidden";
        CloseCode2[CloseCode2["SubprotocolNotAcceptable"] = 4406] = "SubprotocolNotAcceptable";
        CloseCode2[CloseCode2["ConnectionInitialisationTimeout"] = 4408] = "ConnectionInitialisationTimeout";
        CloseCode2[CloseCode2["ConnectionAcknowledgementTimeout"] = 4504] = "ConnectionAcknowledgementTimeout";
        CloseCode2[CloseCode2["SubscriberAlreadyExists"] = 4409] = "SubscriberAlreadyExists";
        CloseCode2[CloseCode2["TooManyInitialisationRequests"] = 4429] = "TooManyInitialisationRequests";
      })(CloseCode || (exports.CloseCode = CloseCode = {}));
      var MessageType;
      (function(MessageType2) {
        MessageType2["ConnectionInit"] = "connection_init";
        MessageType2["ConnectionAck"] = "connection_ack";
        MessageType2["Ping"] = "ping";
        MessageType2["Pong"] = "pong";
        MessageType2["Subscribe"] = "subscribe";
        MessageType2["Next"] = "next";
        MessageType2["Error"] = "error";
        MessageType2["Complete"] = "complete";
      })(MessageType || (exports.MessageType = MessageType = {}));
      function validateMessage(val) {
        if (!(0, utils_1.isObject)(val)) {
          throw new Error(`Message is expected to be an object, but got ${(0, utils_1.extendedTypeof)(val)}`);
        }
        if (!val.type) {
          throw new Error(`Message is missing the 'type' property`);
        }
        if (typeof val.type !== "string") {
          throw new Error(`Message is expects the 'type' property to be a string, but got ${(0, utils_1.extendedTypeof)(val.type)}`);
        }
        switch (val.type) {
          case MessageType.ConnectionInit:
          case MessageType.ConnectionAck:
          case MessageType.Ping:
          case MessageType.Pong: {
            if (val.payload != null && !(0, utils_1.isObject)(val.payload)) {
              throw new Error(`"${val.type}" message expects the 'payload' property to be an object or nullish or missing, but got "${val.payload}"`);
            }
            break;
          }
          case MessageType.Subscribe: {
            if (typeof val.id !== "string") {
              throw new Error(`"${val.type}" message expects the 'id' property to be a string, but got ${(0, utils_1.extendedTypeof)(val.id)}`);
            }
            if (!val.id) {
              throw new Error(`"${val.type}" message requires a non-empty 'id' property`);
            }
            if (!(0, utils_1.isObject)(val.payload)) {
              throw new Error(`"${val.type}" message expects the 'payload' property to be an object, but got ${(0, utils_1.extendedTypeof)(val.payload)}`);
            }
            if (typeof val.payload.query !== "string") {
              throw new Error(`"${val.type}" message payload expects the 'query' property to be a string, but got ${(0, utils_1.extendedTypeof)(val.payload.query)}`);
            }
            if (val.payload.variables != null && !(0, utils_1.isObject)(val.payload.variables)) {
              throw new Error(`"${val.type}" message payload expects the 'variables' property to be a an object or nullish or missing, but got ${(0, utils_1.extendedTypeof)(val.payload.variables)}`);
            }
            if (val.payload.operationName != null && (0, utils_1.extendedTypeof)(val.payload.operationName) !== "string") {
              throw new Error(`"${val.type}" message payload expects the 'operationName' property to be a string or nullish or missing, but got ${(0, utils_1.extendedTypeof)(val.payload.operationName)}`);
            }
            if (val.payload.extensions != null && !(0, utils_1.isObject)(val.payload.extensions)) {
              throw new Error(`"${val.type}" message payload expects the 'extensions' property to be a an object or nullish or missing, but got ${(0, utils_1.extendedTypeof)(val.payload.extensions)}`);
            }
            break;
          }
          case MessageType.Next: {
            if (typeof val.id !== "string") {
              throw new Error(`"${val.type}" message expects the 'id' property to be a string, but got ${(0, utils_1.extendedTypeof)(val.id)}`);
            }
            if (!val.id) {
              throw new Error(`"${val.type}" message requires a non-empty 'id' property`);
            }
            if (!(0, utils_1.isObject)(val.payload)) {
              throw new Error(`"${val.type}" message expects the 'payload' property to be an object, but got ${(0, utils_1.extendedTypeof)(val.payload)}`);
            }
            break;
          }
          case MessageType.Error: {
            if (typeof val.id !== "string") {
              throw new Error(`"${val.type}" message expects the 'id' property to be a string, but got ${(0, utils_1.extendedTypeof)(val.id)}`);
            }
            if (!val.id) {
              throw new Error(`"${val.type}" message requires a non-empty 'id' property`);
            }
            if (!(0, utils_1.areGraphQLErrors)(val.payload)) {
              throw new Error(`"${val.type}" message expects the 'payload' property to be an array of GraphQL errors, but got ${JSON.stringify(val.payload)}`);
            }
            break;
          }
          case MessageType.Complete: {
            if (typeof val.id !== "string") {
              throw new Error(`"${val.type}" message expects the 'id' property to be a string, but got ${(0, utils_1.extendedTypeof)(val.id)}`);
            }
            if (!val.id) {
              throw new Error(`"${val.type}" message requires a non-empty 'id' property`);
            }
            break;
          }
          default:
            throw new Error(`Invalid message 'type' property "${val.type}"`);
        }
        return val;
      }
      exports.validateMessage = validateMessage;
      function isMessage(val) {
        try {
          validateMessage(val);
          return true;
        } catch (_a) {
          return false;
        }
      }
      exports.isMessage = isMessage;
      function parseMessage(data, reviver) {
        return validateMessage(typeof data === "string" ? JSON.parse(data, reviver) : data);
      }
      exports.parseMessage = parseMessage;
      function stringifyMessage(msg, replacer) {
        validateMessage(msg);
        return JSON.stringify(msg, replacer);
      }
      exports.stringifyMessage = stringifyMessage;
    }
  });

  // node_modules/graphql-ws/lib/client.js
  var require_client = __commonJS({
    "node_modules/graphql-ws/lib/client.js"(exports) {
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __exportStar = exports && exports.__exportStar || function(m, exports2) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
      };
      var __await = exports && exports.__await || function(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
      };
      var __asyncGenerator = exports && exports.__asyncGenerator || function(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
          return this;
        }, i;
        function verb(n) {
          if (g[n]) i[n] = function(v) {
            return new Promise(function(a, b) {
              q.push([n, v, a, b]) > 1 || resume(n, v);
            });
          };
        }
        function resume(n, v) {
          try {
            step(g[n](v));
          } catch (e) {
            settle(q[0][3], e);
          }
        }
        function step(r) {
          r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
        }
        function fulfill(value) {
          resume("next", value);
        }
        function reject(value) {
          resume("throw", value);
        }
        function settle(f, v) {
          if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
        }
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.TerminatedCloseEvent = exports.createClient = void 0;
      var common_1 = require_common();
      var utils_1 = require_utils();
      __exportStar(require_common(), exports);
      function createClient(options) {
        const {
          url,
          connectionParams,
          lazy = true,
          onNonLazyError = console.error,
          lazyCloseTimeout: lazyCloseTimeoutMs = 0,
          keepAlive = 0,
          disablePong,
          connectionAckWaitTimeout = 0,
          retryAttempts = 5,
          retryWait = async function randomisedExponentialBackoff(retries2) {
            let retryDelay = 1e3;
            for (let i = 0; i < retries2; i++) {
              retryDelay *= 2;
            }
            await new Promise((resolve) => setTimeout(resolve, retryDelay + // add random timeout from 300ms to 3s
            Math.floor(Math.random() * (3e3 - 300) + 300)));
          },
          shouldRetry = isLikeCloseEvent,
          isFatalConnectionProblem,
          on,
          webSocketImpl,
          /**
           * Generates a v4 UUID to be used as the ID using `Math`
           * as the random number generator. Supply your own generator
           * in case you need more uniqueness.
           *
           * Reference: https://gist.github.com/jed/982883
           */
          generateID = function generateUUID() {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
              const r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
              return v.toString(16);
            });
          },
          jsonMessageReplacer: replacer,
          jsonMessageReviver: reviver
        } = options;
        let ws;
        if (webSocketImpl) {
          if (!isWebSocket(webSocketImpl)) {
            throw new Error("Invalid WebSocket implementation provided");
          }
          ws = webSocketImpl;
        } else if (typeof WebSocket !== "undefined") {
          ws = WebSocket;
        } else if (typeof global !== "undefined") {
          ws = global.WebSocket || // @ts-expect-error: Support more browsers
          global.MozWebSocket;
        } else if (typeof window !== "undefined") {
          ws = window.WebSocket || // @ts-expect-error: Support more browsers
          window.MozWebSocket;
        }
        if (!ws)
          throw new Error("WebSocket implementation missing; on Node you can `import WebSocket from 'ws';` and pass `webSocketImpl: WebSocket` to `createClient`");
        const WebSocketImpl = ws;
        const emitter = (() => {
          const message = /* @__PURE__ */ (() => {
            const listeners2 = {};
            return {
              on(id, listener) {
                listeners2[id] = listener;
                return () => {
                  delete listeners2[id];
                };
              },
              emit(message2) {
                var _a;
                if ("id" in message2)
                  (_a = listeners2[message2.id]) === null || _a === void 0 ? void 0 : _a.call(listeners2, message2);
              }
            };
          })();
          const listeners = {
            connecting: (on === null || on === void 0 ? void 0 : on.connecting) ? [on.connecting] : [],
            opened: (on === null || on === void 0 ? void 0 : on.opened) ? [on.opened] : [],
            connected: (on === null || on === void 0 ? void 0 : on.connected) ? [on.connected] : [],
            ping: (on === null || on === void 0 ? void 0 : on.ping) ? [on.ping] : [],
            pong: (on === null || on === void 0 ? void 0 : on.pong) ? [on.pong] : [],
            message: (on === null || on === void 0 ? void 0 : on.message) ? [message.emit, on.message] : [message.emit],
            closed: (on === null || on === void 0 ? void 0 : on.closed) ? [on.closed] : [],
            error: (on === null || on === void 0 ? void 0 : on.error) ? [on.error] : []
          };
          return {
            onMessage: message.on,
            on(event, listener) {
              const l = listeners[event];
              l.push(listener);
              return () => {
                l.splice(l.indexOf(listener), 1);
              };
            },
            emit(event, ...args) {
              for (const listener of [...listeners[event]]) {
                listener(...args);
              }
            }
          };
        })();
        function errorOrClosed(cb) {
          const listening = [
            // errors are fatal and more critical than close events, throw them first
            emitter.on("error", (err) => {
              listening.forEach((unlisten) => unlisten());
              cb(err);
            }),
            // closes can be graceful and not fatal, throw them second (if error didnt throw)
            emitter.on("closed", (event) => {
              listening.forEach((unlisten) => unlisten());
              cb(event);
            })
          ];
        }
        let connecting, locks = 0, lazyCloseTimeout, retrying = false, retries = 0, disposed = false;
        async function connect() {
          clearTimeout(lazyCloseTimeout);
          const [socket, throwOnClose] = await (connecting !== null && connecting !== void 0 ? connecting : connecting = new Promise((connected, denied) => (async () => {
            if (retrying) {
              await retryWait(retries);
              if (!locks) {
                connecting = void 0;
                return denied({ code: 1e3, reason: "All Subscriptions Gone" });
              }
              retries++;
            }
            emitter.emit("connecting", retrying);
            const socket2 = new WebSocketImpl(typeof url === "function" ? await url() : url, common_1.GRAPHQL_TRANSPORT_WS_PROTOCOL);
            let connectionAckTimeout, queuedPing;
            function enqueuePing() {
              if (isFinite(keepAlive) && keepAlive > 0) {
                clearTimeout(queuedPing);
                queuedPing = setTimeout(() => {
                  if (socket2.readyState === WebSocketImpl.OPEN) {
                    socket2.send((0, common_1.stringifyMessage)({ type: common_1.MessageType.Ping }));
                    emitter.emit("ping", false, void 0);
                  }
                }, keepAlive);
              }
            }
            errorOrClosed((errOrEvent) => {
              connecting = void 0;
              clearTimeout(connectionAckTimeout);
              clearTimeout(queuedPing);
              denied(errOrEvent);
              if (errOrEvent instanceof TerminatedCloseEvent) {
                socket2.close(4499, "Terminated");
                socket2.onerror = null;
                socket2.onclose = null;
              }
            });
            socket2.onerror = (err) => emitter.emit("error", err);
            socket2.onclose = (event) => emitter.emit("closed", event);
            socket2.onopen = async () => {
              try {
                emitter.emit("opened", socket2);
                const payload = typeof connectionParams === "function" ? await connectionParams() : connectionParams;
                if (socket2.readyState !== WebSocketImpl.OPEN)
                  return;
                socket2.send((0, common_1.stringifyMessage)(payload ? {
                  type: common_1.MessageType.ConnectionInit,
                  payload
                } : {
                  type: common_1.MessageType.ConnectionInit
                  // payload is completely absent if not provided
                }, replacer));
                if (isFinite(connectionAckWaitTimeout) && connectionAckWaitTimeout > 0) {
                  connectionAckTimeout = setTimeout(() => {
                    socket2.close(common_1.CloseCode.ConnectionAcknowledgementTimeout, "Connection acknowledgement timeout");
                  }, connectionAckWaitTimeout);
                }
                enqueuePing();
              } catch (err) {
                emitter.emit("error", err);
                socket2.close(common_1.CloseCode.InternalClientError, (0, utils_1.limitCloseReason)(err instanceof Error ? err.message : new Error(err).message, "Internal client error"));
              }
            };
            let acknowledged = false;
            socket2.onmessage = ({ data }) => {
              try {
                const message = (0, common_1.parseMessage)(data, reviver);
                emitter.emit("message", message);
                if (message.type === "ping" || message.type === "pong") {
                  emitter.emit(message.type, true, message.payload);
                  if (message.type === "pong") {
                    enqueuePing();
                  } else if (!disablePong) {
                    socket2.send((0, common_1.stringifyMessage)(message.payload ? {
                      type: common_1.MessageType.Pong,
                      payload: message.payload
                    } : {
                      type: common_1.MessageType.Pong
                      // payload is completely absent if not provided
                    }));
                    emitter.emit("pong", false, message.payload);
                  }
                  return;
                }
                if (acknowledged)
                  return;
                if (message.type !== common_1.MessageType.ConnectionAck)
                  throw new Error(`First message cannot be of type ${message.type}`);
                clearTimeout(connectionAckTimeout);
                acknowledged = true;
                emitter.emit("connected", socket2, message.payload, retrying);
                retrying = false;
                retries = 0;
                connected([
                  socket2,
                  new Promise((_, reject) => errorOrClosed(reject))
                ]);
              } catch (err) {
                socket2.onmessage = null;
                emitter.emit("error", err);
                socket2.close(common_1.CloseCode.BadResponse, (0, utils_1.limitCloseReason)(err instanceof Error ? err.message : new Error(err).message, "Bad response"));
              }
            };
          })()));
          if (socket.readyState === WebSocketImpl.CLOSING)
            await throwOnClose;
          let release = () => {
          };
          const released = new Promise((resolve) => release = resolve);
          return [
            socket,
            release,
            Promise.race([
              // wait for
              released.then(() => {
                if (!locks) {
                  const complete = () => socket.close(1e3, "Normal Closure");
                  if (isFinite(lazyCloseTimeoutMs) && lazyCloseTimeoutMs > 0) {
                    lazyCloseTimeout = setTimeout(() => {
                      if (socket.readyState === WebSocketImpl.OPEN)
                        complete();
                    }, lazyCloseTimeoutMs);
                  } else {
                    complete();
                  }
                }
              }),
              // or
              throwOnClose
            ])
          ];
        }
        function shouldRetryConnectOrThrow(errOrCloseEvent) {
          if (isLikeCloseEvent(errOrCloseEvent) && (isFatalInternalCloseCode(errOrCloseEvent.code) || [
            common_1.CloseCode.InternalServerError,
            common_1.CloseCode.InternalClientError,
            common_1.CloseCode.BadRequest,
            common_1.CloseCode.BadResponse,
            common_1.CloseCode.Unauthorized,
            // CloseCode.Forbidden, might grant access out after retry
            common_1.CloseCode.SubprotocolNotAcceptable,
            // CloseCode.ConnectionInitialisationTimeout, might not time out after retry
            // CloseCode.ConnectionAcknowledgementTimeout, might not time out after retry
            common_1.CloseCode.SubscriberAlreadyExists,
            common_1.CloseCode.TooManyInitialisationRequests
            // 4499, // Terminated, probably because the socket froze, we want to retry
          ].includes(errOrCloseEvent.code)))
            throw errOrCloseEvent;
          if (disposed)
            return false;
          if (isLikeCloseEvent(errOrCloseEvent) && errOrCloseEvent.code === 1e3)
            return locks > 0;
          if (!retryAttempts || retries >= retryAttempts)
            throw errOrCloseEvent;
          if (!shouldRetry(errOrCloseEvent))
            throw errOrCloseEvent;
          if (isFatalConnectionProblem === null || isFatalConnectionProblem === void 0 ? void 0 : isFatalConnectionProblem(errOrCloseEvent))
            throw errOrCloseEvent;
          return retrying = true;
        }
        if (!lazy) {
          (async () => {
            locks++;
            for (; ; ) {
              try {
                const [, , throwOnClose] = await connect();
                await throwOnClose;
              } catch (errOrCloseEvent) {
                try {
                  if (!shouldRetryConnectOrThrow(errOrCloseEvent))
                    return;
                } catch (errOrCloseEvent2) {
                  return onNonLazyError === null || onNonLazyError === void 0 ? void 0 : onNonLazyError(errOrCloseEvent2);
                }
              }
            }
          })();
        }
        function subscribe(payload, sink) {
          const id = generateID(payload);
          let done = false, errored = false, releaser = () => {
            locks--;
            done = true;
          };
          (async () => {
            locks++;
            for (; ; ) {
              try {
                const [socket, release, waitForReleaseOrThrowOnClose] = await connect();
                if (done)
                  return release();
                const unlisten = emitter.onMessage(id, (message) => {
                  switch (message.type) {
                    case common_1.MessageType.Next: {
                      sink.next(message.payload);
                      return;
                    }
                    case common_1.MessageType.Error: {
                      errored = true, done = true;
                      sink.error(message.payload);
                      releaser();
                      return;
                    }
                    case common_1.MessageType.Complete: {
                      done = true;
                      releaser();
                      return;
                    }
                  }
                });
                socket.send((0, common_1.stringifyMessage)({
                  id,
                  type: common_1.MessageType.Subscribe,
                  payload
                }, replacer));
                releaser = () => {
                  if (!done && socket.readyState === WebSocketImpl.OPEN)
                    socket.send((0, common_1.stringifyMessage)({
                      id,
                      type: common_1.MessageType.Complete
                    }, replacer));
                  locks--;
                  done = true;
                  release();
                };
                await waitForReleaseOrThrowOnClose.finally(unlisten);
                return;
              } catch (errOrCloseEvent) {
                if (!shouldRetryConnectOrThrow(errOrCloseEvent))
                  return;
              }
            }
          })().then(() => {
            if (!errored)
              sink.complete();
          }).catch((err) => {
            sink.error(err);
          });
          return () => {
            if (!done)
              releaser();
          };
        }
        return {
          on: emitter.on,
          subscribe,
          iterate(request) {
            const pending = [];
            const deferred = {
              done: false,
              error: null,
              resolve: () => {
              }
            };
            const dispose = subscribe(request, {
              next(val) {
                pending.push(val);
                deferred.resolve();
              },
              error(err) {
                deferred.done = true;
                deferred.error = err;
                deferred.resolve();
              },
              complete() {
                deferred.done = true;
                deferred.resolve();
              }
            });
            const iterator = (function iterator2() {
              return __asyncGenerator(this, arguments, function* iterator_1() {
                for (; ; ) {
                  if (!pending.length) {
                    yield __await(new Promise((resolve) => deferred.resolve = resolve));
                  }
                  while (pending.length) {
                    yield yield __await(pending.shift());
                  }
                  if (deferred.error) {
                    throw deferred.error;
                  }
                  if (deferred.done) {
                    return yield __await(void 0);
                  }
                }
              });
            })();
            iterator.throw = async (err) => {
              if (!deferred.done) {
                deferred.done = true;
                deferred.error = err;
                deferred.resolve();
              }
              return { done: true, value: void 0 };
            };
            iterator.return = async () => {
              dispose();
              return { done: true, value: void 0 };
            };
            return iterator;
          },
          async dispose() {
            disposed = true;
            if (connecting) {
              const [socket] = await connecting;
              socket.close(1e3, "Normal Closure");
            }
          },
          terminate() {
            if (connecting) {
              emitter.emit("closed", new TerminatedCloseEvent());
            }
          }
        };
      }
      exports.createClient = createClient;
      var TerminatedCloseEvent = class extends Error {
        constructor() {
          super(...arguments);
          this.name = "TerminatedCloseEvent";
          this.message = "4499: Terminated";
          this.code = 4499;
          this.reason = "Terminated";
          this.wasClean = false;
        }
      };
      exports.TerminatedCloseEvent = TerminatedCloseEvent;
      function isLikeCloseEvent(val) {
        return (0, utils_1.isObject)(val) && "code" in val && "reason" in val;
      }
      function isFatalInternalCloseCode(code) {
        if ([
          1e3,
          1001,
          1006,
          1005,
          1012,
          1013,
          1014
          // Bad Gateway
        ].includes(code))
          return false;
        return code >= 1e3 && code <= 1999;
      }
      function isWebSocket(val) {
        return typeof val === "function" && "constructor" in val && "CLOSED" in val && "CLOSING" in val && "CONNECTING" in val && "OPEN" in val;
      }
    }
  });
  return require_client();
})();
