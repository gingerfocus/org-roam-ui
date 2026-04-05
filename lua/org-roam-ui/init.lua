local M = {}

local server = require("org-roam-ui.server")

M.config = {
    port_http = 35901,
    port_ws = 35903,
    open_on_start = true,
    browser_command = nil,
}

-- responds to a
local function responder(input)
    -- vim.json.decode(data)
    vim.notify("WS Received: " .. input)

    M.data(function(data)
        -- vim.notify("[orui] Fetched " .. #data.nodes .. " nodes, " .. #data.links .. " links",
        --     vim.log.levels.INFO)
        server.send({ data = data, type = "graphdata" })
    end)
end

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

    M.roam = require("org-roam")

    M.config = vim.tbl_deep_extend("force", M.config, config or {})
    -- server.port_http = M.port_http
    -- server.port_ws = M.port_ws

    vim.keymap.set('n', '<leader>nu', M.open, { desc = "Open org-roam-ui in browser" })
    vim.keymap.set('n', '<leader>nx', M.stop, { desc = "Stop org-roam-ui server" })

    -- close server
    vim.api.nvim_create_autocmd("VimLeavePre", { callback = M.stop })
    -- send new node data
    vim.api.nvim_create_autocmd("BufWritePost", {
        pattern = "*.org",
        callback = M.refresh
    })
end

function M.refresh()
    if not server.running() then return end

    -- TODO
end

function M.open()
    -- this function already checks if it is running, no need
    server.start(responder)

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

function M.data(callback)
    -- M.roam.database:files_path()

    -- HACK: I cant figure out why this is broken so this is my thing for now
    local f = io.open("/home/focus/dev/org-roam-ui/example.json", "r")
    if f then
        local content = f:read("*a") -- "*a" reads the whole file
        f:close()
        callback(content)
        return
    end

    M.roam.database:files():next(function(files)
        vim.notify(files)

        local newnodes = {}
        local newlinks = {}

        for _, path in ipairs(files.paths) do
            M.roam.database:find_nodesbyfile(path):next(function(nodes)
                vim.notify("found " .. #nodes .. " nodes")
                for _, node in ipairs(nodes) do
                    newnodes[#newnodes + 1] = node
                end
            end)
            M.roam.database:get_filelinks(path):next(function(links)
                vim.notify("found " .. #links .. " links")
                for link, _ in pairs(links) do
                    newlinks[#newlinks + 1] = link
                end
            end)
        end

        -- wait some time to wait for things
        vim.defer_fn(function()
            local value = {
                nodes = newnodes,
                links = newlinks,
            }
            vim.notify(value)
            callback(value)
        end, 1000)
    end)
end

return M
