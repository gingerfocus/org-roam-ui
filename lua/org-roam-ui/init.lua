local M = {}

local server = require("org-roam-ui.server")
local backend = require("org-roam-ui.backend")

M.config = {
    port_http = 35901,
    port_ws = 35903,
    open_on_start = true,
    browser_command = nil,
}

-- TODO: make a checkhealth function
function M.check()
    if vim.fn.executable("websocat") == 0 then
        vim.notify("[orui]: Missing `websocat` binary. Is it installed?", vim.log.levels.ERROR)
        return false
    end

    if vim.fn.executable("npm") == 0 then
        vim.notify("[orui]: Missing `npm` binary. Is it installed?", vim.log.levels.ERROR)
        return false
    end

    local ok, _ = pcall(require, "plenary")

    if not ok then
        vim.notify("[orui]: Missing `plenary.nvim`. Add 'nvim-lua/plenary.nvim' to config.", vim.log.levels.ERROR)
        return false
    end

    return true
end

function M.setup(config)
    if not M.check() then
        return
    end

    M.config = vim.tbl_deep_extend("force", M.config, config or {})
    -- server.port_http = M.port_http
    -- server.port_ws = M.port_ws

    vim.api.nvim_create_user_command("OrgRoamUiOpen", M.open, { desc = "Open org-roam-ui in browser" })
    vim.api.nvim_create_user_command("OrgRoamUiClose", M.stop, { desc = "Stop org-roam-ui server" })

    -- TODO
    -- vim.api.nvim_create_autocmd("BufWritePost", {
    --     pattern = "*.org",
    --     callback = function()
    --         if server.is_running() then
    --             M.refresh()
    --         end
    --     end,
    --     desc = "Refresh org-roam-ui on org file save",
    -- })
end

function M.open()
    -- this function already check if it is running, no need
    server.start()

    vim.defer_fn(function()
        backend.data(function(data)
            vim.notify("[orui] Fetched " .. #data.nodes .. " nodes, " .. #data.links .. " links", vim.log.levels.INFO)
            server.send(data)
        end)
    end, 500)

    -- Open the server
    vim.defer_fn(function()
        local url = string.format("http://localhost:%d", M.config.port_http)
        local cmd = M.config.browser_command

        vim.fn.jobstart({ cmd or "xdg-open", url })
    end, 1000)
end

function M.stop()
    server.stop()
end

return M
