local M = {}

local Job = require("plenary.job")

local function get_script_path()
  local candidates = {
    os.getenv("PWD") .. "/rplugin/node/index.js",
    vim.fn.getcwd() .. "/rplugin/node/index.js",
  }

  for _, path in ipairs(candidates) do
    if vim.fn.filereadable(path) == 1 then
      return path
    end
  end

  return candidates[1]
end

M.server = nil
M.http_port = 35901
M.ws_port = 35903
M.node_process = nil

function M.get_homedir()
  if vim.fn.has("unix") == 1 then
    return vim.fn.expand("~")
  end
  return vim.env.USERPROFILE or vim.fn.expand("~")
end

function M.start(config)
  if M.node_process and M.node_process.is_running then
    vim.notify("org-roam-ui server is already running", vim.log.levels.WARN)
    return
  end

  local script_path = get_script_path()

  if vim.fn.filereadable(script_path) == 0 then
    vim.notify("org-roam-ui server script not found: " .. script_path, vim.log.levels.ERROR)
    return
  end

  local env = {
    "ORUI_HTTP_PORT=" .. M.http_port,
    "ORUI_WS_PORT=" .. M.ws_port,
  }

  local function kill_existing_server()
    vim.fn.jobstart({ "fuser", "-k", M.http_port .. "/tcp" })
    vim.fn.jobstart({ "fuser", "-k", M.ws_port .. "/tcp" })
  end

  kill_existing_server()
  vim.defer_fn(function()
    M.node_process = Job:new({
      command = "node",
      args = { script_path },
      env = env,
      on_stdout = function(_, data)
        local output = type(data) == "table" and table.concat(data, "") or tostring(data)
        if output and output ~= "" then
          vim.schedule(function()
            vim.api.nvim_out_write("[org-roam-ui] " .. output .. "\n")
          end)
        end
      end,
      on_stderr = function(_, data)
        local output = type(data) == "table" and table.concat(data, "") or tostring(data)
        if output and output ~= "" then
          vim.schedule(function()
            vim.api.nvim_err_writeln("[org-roam-ui] " .. output)
          end)
        end
      end,
      on_exit = function(_, exit_code)
        vim.schedule(function()
          local code = exit_code or "unknown"
          vim.api.nvim_out_write("[org-roam-ui] Server exited with code " .. code .. "\n")
          M.node_process = nil
        end)
      end,
    })

    M.node_process:start()
    vim.notify("org-roam-ui server starting...", vim.log.levels.INFO)
  end, 500)
end

function M.stop()
  if M.node_process then
    M.node_process:shutdown()
    M.node_process = nil
    vim.notify("org-roam-ui server stopped", vim.log.levels.INFO)
  else
    vim.notify("org-roam-ui server is not running", vim.log.levels.WARN)
  end
end

function M.send_graph_data(data)
  local url = string.format("http://localhost:%d/graphdata", M.http_port)
  local tmpfile = vim.fn.tempname()
  local json_str = vim.fn.json_encode(data)
  vim.fn.writefile({json_str}, tmpfile)

  vim.fn.jobstart({
    "curl",
    "-s",
    "-X", "POST",
    "-H", "Content-Type: application/json",
    "--data-binary", "@" .. tmpfile,
    url,
  }, {
    on_stdout = function(_, data)
    end,
    on_stderr = function(_, data)
      if data and #data > 0 then
        vim.schedule(function()
          vim.api.nvim_err_writeln("[org-roam-ui] curl error: " .. table.concat(data, ""))
        end)
      end
    end,
    on_exit = function()
      vim.fn.delete(tmpfile)
    end,
  })
end

function M.is_running()
  return M.node_process ~= nil and M.node_process.is_running
end

return M