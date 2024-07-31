'use strict';

let _pids = [];
let _tasks = {};

const addTask = (name, handler, interval) => {
  _tasks[name] = { name, handler, interval };
};

const removeTask = (name) => {
  delete _tasks[name];
}

const start = async () => {
  _pids = Object.values(_tasks).map(task => {
    task.pid = setInterval(task.handler, task.interval);
    return task.pid;
  });
};

const stop = () => {
  _pids.forEach(pid => {
    clearInterval(pid);
  });

  Object.values(_tasks).forEach(task => {
    clearInterval(task.pid);
    task.pid = null;
  });

  _pids = [];
};

module.exports = { addTask, removeTask, start, stop };