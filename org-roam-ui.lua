-- org-roam-ui.lua
-- Entry point for the org-roam-ui neovim plugin (Lua version)
--
-- This file provides backward compatibility and loads the Lua plugin from lua/org-roam-ui/

local org_roam_ui = {
  prefix = "org-roam-ui-",
  link = "https://github.com/org-roam/org-roam-ui",
}

local org_roam_ui_root_dir = "/home/focus/dev/org-roam-ui" -- vim.fn.getcwd()
local org_roam_ui_app_build_dir = org_roam_ui_root_dir .. "/out/"
local org_roam_ui_port = 35901

local org_roam_ui__ws_current_node = nil
local org_roam_ui_ws_socket = nil
local org_roam_ui__window = nil
local org_roam_ui_ws_server = nil

local function load_lua_plugin()
  local plugin_path = org_roam_ui_root_dir .. "/lua/org-roam-ui/init.lua"
  if vim.fn.filereadable(plugin_path) == 1 then
    package.path = org_roam_ui_root_dir .. "/lua/?.lua;" .. package.path
    return require("org-roam-ui")
  end
  return nil
end

local org_roam_ui_lua = load_lua_plugin()

function org_roam_ui.setup(opts)
  if org_roam_ui_lua and org_roam_ui_lua.setup then
    org_roam_ui_lua.setup(opts)
  else
    vim.notify("org-roam-ui Lua plugin not found. Make sure the plugin is properly installed.", vim.log.levels.ERROR)
  end
end

function org_roam_ui.open()
  if org_roam_ui_lua and org_roam_ui_lua.open then
    org_roam_ui_lua.open()
  else
    vim.notify("org-roam-ui Lua plugin not found", vim.log.levels.ERROR)
  end
end

function org_roam_ui.init()
  if org_roam_ui_lua and org_roam_ui_lua.init_server then
    org_roam_ui_lua.init_server()
  else
    vim.notify("org-roam-ui Lua plugin not found", vim.log.levels.ERROR)
  end
end

function org_roam_ui.close()
  if org_roam_ui_lua and org_roam_ui_lua.stop then
    org_roam_ui_lua.stop()
  else
    vim.notify("org-roam-ui Lua plugin not found", vim.log.levels.ERROR)
  end
end

function org_roam_ui.refresh()
  if org_roam_ui_lua and org_roam_ui_lua.refresh then
    org_roam_ui_lua.refresh()
  else
    vim.notify("org-roam-ui Lua plugin not found", vim.log.levels.ERROR)
  end
end

function org_roam_ui.toggle()
  if org_roam_ui_lua and org_roam_ui_lua.toggle then
    org_roam_ui_lua.toggle()
  else
    vim.notify("org-roam-ui Lua plugin not found", vim.log.levels.ERROR)
  end
end

return org_roam_ui
