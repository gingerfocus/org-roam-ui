local M = {}

function M.check()
    -- vim.health.start("ORUI dependencies")
    -- vim.health.warn
    -- vim.health.info

    if vim.fn.executable("websocat") == 0 then
        vim.health.error("Missing `websocat` binary")
    else
        vim.health.ok("`websocat` is installed")
    end
end

return M
