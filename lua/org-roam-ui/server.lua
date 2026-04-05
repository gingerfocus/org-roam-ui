local M = {
    process = nil,
    websock = nil,
    port_http = 35901,
    port_ws = 35903,
}

function M.start(responder)
    if M.running() then
        vim.notify("[orui] server is already running", vim.log.levels.WARN)
        return
    end

    -- vim.fn.jobstart({ "fuser", "-k", M.port_http .. "/tcp" })
    -- vim.fn.jobstart({ "fuser", "-k", M.port_ws .. "/tcp" })

    vim.notify("[orui]: server starting ...", vim.log.levels.INFO)
    local args = { "npx", "vite", "dev", "--port", tostring(M.port_http) }
    vim.print(args)
    M.process = vim.system(
        args,
        {
            cwd = "/home/focus/dev/org-roam-ui", -- TODO: dont hardcode this
            stdin = true,
            stderr = function(_, data)
                if not data then return end

                local output =
                    type(data) == "table" and table.concat(data, "")
                    or tostring(data)
                if #output == 0 then return end

                vim.schedule(function()
                    vim.notify("[orui] " .. output .. "\n", vim.log.levels.ERROR)
                end)
            end,
            on_exit = function(obj)
                M.process = nil
                vim.schedule(function()
                    local code = obj.code
                    vim.notify("[orui] Server exited with code " .. code .. "\n", vim.log.levels.ERROR)
                end)
            end,
        }
    )

    vim.notify("[orui]: Websocat bridge starting...", vim.log.levels.INFO)
    M.websock = vim.system(
        { "websocat", "-s", tostring(M.port_ws) },
        {
            stdin = true,
            stdout = function(_, data)
                if not data then return end
                vim.schedule(function() responder(data) end)
            end,
            on_exit = function()
                M.websock = nil
            end,
        }
    )
end

function M.stop()
    if M.websock then
        M.websock:kill()
        M.websock = nil
    end

    if M.process then
        M.process:kill()
        M.process = nil

        vim.notify("[orui] server stopped", vim.log.levels.INFO)
    else
        vim.notify("[orui] server is not running", vim.log.levels.WARN)
    end
end

function M.send(data)
    local msg = vim.json.encode(data)
    -- websocat sends a frame for every line it receives on stdin
    M.websock:write(msg .. "\n")
end

function M.running()
    return M.process ~= nil and M.process.is_running
end

return M
