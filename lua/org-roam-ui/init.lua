local M = {}

local server = require("org-roam-ui.server")
local org_roam = require("org-roam-ui.org-roam")

M.config = {
  http_port = 35901,
  ws_port = 35903,
  open_on_start = true,
  browser_command = nil,
}

function M.check_dependencies()
  local ok, _ = pcall(require, "plenary")
  if not ok then
    vim.notify("org-roam-ui: plenary.nvim is required but not installed", vim.log.levels.ERROR)
    return false
  end
  return true
end

function M.setup(user_config)
  if not M.check_dependencies() then
    return
  end

  M.config = vim.tbl_deep_extend("force", M.config, user_config or {})

  server.http_port = M.config.http_port
  server.ws_port = M.config.ws_port

  vim.api.nvim_create_user_command("OrgRoamUiOpen", function()
    M.open()
  end, {
    desc = "Open org-roam-ui in browser",
  })

  vim.api.nvim_create_user_command("OrgRoamUiInit", function()
    M.init_server()
  end, {
    desc = "Start org-roam-ui server without opening browser",
  })

  vim.api.nvim_create_user_command("OrgRoamUiClose", function()
    M.stop()
  end, {
    desc = "Stop org-roam-ui server",
  })

  vim.api.nvim_create_user_command("OrgRoamUiRefresh", function()
    M.refresh()
  end, {
    desc = "Refresh graph data",
  })

  vim.api.nvim_create_user_command("OrgRoamUiToggle", function()
    M.toggle()
  end, {
    desc = "Toggle org-roam-ui server",
  })

  vim.api.nvim_create_autocmd("BufWritePost", {
    pattern = "*.org",
    callback = function()
      if server.is_running() then
        M.refresh()
      end
    end,
    desc = "Refresh org-roam-ui on org file save",
  })
end

function M.init_server()
  if server.is_running() then
    vim.notify("org-roam-ui server is already running", vim.log.levels.WARN)
    return
  end

  local config = {
    org_roam_directory = org_roam.get_roam_directory(),
  }

  server.start(config)

  vim.defer_fn(function()
    local data = org_roam.get_graph_data()
    vim.notify("[org-roam-ui] Fetched " .. #data.nodes .. " nodes, " .. #data.links .. " links", vim.log.levels.INFO)
    server.send_graph_data(data)
  end, 500)
end

function M.open()
  M.init_server()

  vim.defer_fn(function()
    local url = string.format("http://localhost:%d", M.config.http_port)
    local cmd = M.config.browser_command

    if cmd then
      vim.fn.jobstart({ cmd, url })
    else
      vim.fn.jobstart({ "xdg-open", url })
    end
  end, 1000)
end

function M.stop()
  server.stop()
end

function M.refresh()
  if not server.is_running() then
    vim.notify("org-roam-ui server is not running", vim.log.levels.WARN)
    return
  end

  local data = org_roam.get_graph_data()
  server.send_graph_data(data)
end

function M.toggle()
  if server.is_running() then
    M.stop()
  else
    M.init_server()
  end
end

return M