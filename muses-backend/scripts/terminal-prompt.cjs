const readline = require("node:readline");
const { Writable } = require("node:stream");
function terminalPrompt(input = process.stdin, output = process.stdout) {
  let muted = false,
    closed = false,
    pending;
  const hiddenOutput = new Writable({
    write(chunk, encoding, done) {
      if (!muted) output.write(chunk, encoding);
      done();
    },
  });
  const rl = readline.createInterface({
    input,
    output: hiddenOutput,
    terminal: Boolean(input.isTTY),
  });
  rl.on("close", () => {
    closed = true;
    muted = false;
    pending?.reject(Error("Đã hủy nhập thông tin."));
    pending = null;
  });
  rl.on("SIGINT", () => rl.close());
  return {
    ask(question, secret = false) {
      if (closed)
        return Promise.reject(Error("Không còn luồng nhập thông tin."));
      if (secret) output.write(question);
      muted = secret;
      return new Promise((resolve, reject) => {
        pending = { reject };
        rl.question(secret ? "" : question, (answer) => {
          pending = null;
          muted = false;
          if (secret) output.write("\n");
          resolve(answer);
        });
      });
    },
    close() {
      rl.close();
    },
  };
}
module.exports = { terminalPrompt };
