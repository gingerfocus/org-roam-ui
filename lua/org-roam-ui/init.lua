local M = {}

M.config = {
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
        M.send({ data = data, type = "graphdata" })
    end)
end

function M.start()
    if M.running() then
        vim.notify("[orui] server is already running", vim.log.levels.WARN)
        return
    end

    -- vim.fn.jobstart({ "fuser", "-k", M.port_ws .. "/tcp" })

    vim.notify("[orui]: Websocat bridge starting...", vim.log.levels.INFO)
    M.websock = vim.system(
        { "websocat", "-s", tostring(M.port_ws) },
        {
            stdin = true,
            stdout = function(_, data)
                if not data then return end
                vim.schedule(function() responder(data) end)
            end,
            on_exit = function() M.websock = nil end,
        }
    )
end

function M.stop()
    if M.websock then
        M.websock:kill()
        M.websock = nil
    end
end

function M.send(data)
    local msg = vim.json.encode(data)
    M.websock:write(msg .. "\n")
end

function M.running()
    return M.websock ~= nil
end

function M.refresh()
    if not M.running() then return end

    -- TODO
end

function M.open()
    -- this function already checks if it is running, no need
    M.start()

    -- Open the server
    vim.defer_fn(function()
        vim.system({ "xdg-open", "/home/focus/dev/org-mod-ui/dist/index.html" })
    end, 1000)
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

function M.setup(config)
    M.config = vim.tbl_deep_extend("force", M.config, config or {})
    M.roam = require("org-roam")

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

return M
