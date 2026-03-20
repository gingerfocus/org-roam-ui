---@class Server
---@field process Job|nil Server command
---@field websock Job|nil Websocket to communicate with command
---@field port_http integer 
---@field port_ws integer 
local M = {
    process = nil,
    websock = nil,
    port_http = 35901,
    port_ws = 35903,
}

local Job = require("plenary.job")

-- helper function to find executable
local function find(name)
    local path = vim.fn.exepath(name)
    if #path > 0 then
        return path
    end
    return name
end

function M.start()
    if M.running() then
        vim.notify("[orui] server is already running", vim.log.levels.WARN)
        return
    end

    -- vim.fn.jobstart({ "fuser", "-k", M.port_http .. "/tcp" })
    -- vim.fn.jobstart({ "fuser", "-k", M.port_ws .. "/tcp" })

    vim.defer_fn(function()
        M.process = Job:new({
            command = find("npx"),
            args = { "next", "dev", "-p", tostring(M.port_http) },
            cwd = "/home/focus/dev/org-roam-ui", -- TODO: dont hardcode this
            env = {
                "PATH=" .. vim.env.PATH,
                "ORUI_PORT_HTTP=" .. M.port_http,
                "ORUI_PORT_WS=" .. M.port_ws,
            },
            on_stdout = function(_, data)
                -- IGNORE IT

                -- if not data then return end
                -- local output = type(data) == "table" and table.concat(data, "") or tostring(data)
                -- if #output == 0 then return end
                -- vim.schedule(function()
                --     vim.notify("[orui] " .. output .. "\n", vim.log.levels.INFO)
                -- end)
            end,
            on_stderr = function(_, data)
                if not data then
                    return
                end
                local output = type(data) == "table" and table.concat(data, "") or tostring(data)
                if #output == 0 then
                    return
                end

                vim.schedule(function()
                    vim.notify("[orui] " .. output .. "\n", vim.log.levels.ERROR)
                end)
            end,
            on_exit = function(_, exit_code)
                vim.schedule(function()
                    local code = exit_code or "unknown"
                    vim.api.nvim_out_write("[orui] Server exited with code " .. code .. "\n")
                    M.process = nil
                end)
            end,
        })

        vim.notify("[orui]: server starting ...", vim.log.levels.INFO)
        M.process:start()

        -- --unbuffered is crucial for real-time interaction
        M.websock = Job:new({
            command = find("websocat"),
            args = { "--unbuffered", "ws://localhost:35903" },
            on_stdout = function(_, data)
                -- TODO: json parse and act on this

                -- for _, line in ipairs(data) do
                --     if line ~= "" then
                --         vim.schedule(function()
                --             print("WS Received: " .. line)
                --         end)
                --     end
                -- end
            end,
            on_exit = function()
                M.websock = nil
            end,
        })
        vim.notify("[orui]: Websocat bridge started", vim.log.levels.INFO)
    end, 500)
end

function M.stop()
    if M.websock then
        M.websock:shutdown()
        M.websock = nil
    end

    if M.process then
        -- TODO: this just does work
        M.process:shutdown()
        M.process = nil

        vim.notify("[orui] server stopped", vim.log.levels.INFO)
    else
        vim.notify("[orui] server is not running", vim.log.levels.WARN)
    end

end

function M.send(data)

    local msg = vim.json.encode(data)
    -- websocat sends a frame for every line it receives on stdin
    M.websock:send(msg .. "\n")
end

function M.running()
    return M.process ~= nil and M.process.is_running
end

return M

--[[
local url = string.format("ws://localhost:%d", orui.port_ws)
local tmpfile = vim.fn.tempname()
local payload = vim.fn.json_encode({
    type = "graphdata",
    data = data,
})
vim.fn.writefile({ payload }, tmpfile)

vim.fn.jobstart({ "websocat", url, "--json", tmpfile }, {
    -- cwd = ""
    on_stdout = function(_, data) end,
    on_stderr = function(_, data)
        if not data then
            return
        end
        local output = type(data) == "table" and table.concat(data, "") or tostring(data)
        if #output == 0 then
            return
        end

        vim.schedule(function()
            vim.notify("[orui] websocat error: " .. output, vim.log.level.ERROR)
        end)
    end,
    on_exit = function()
        vim.fn.delete(tmpfile)
    end,
})
--]]
