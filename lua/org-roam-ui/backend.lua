local M = {}

local roam = require("org-roam")

function M.directory()
    return roam.database:files_path()
end

function M.data(callback)
    roam.database:files():next(function(files)
        local nodes = {}
        local links = {}

        -- TODO: find subnodes
        for _, path in ipairs(files.paths) do
            roam.database:get_filelinks(path):next(function(links)
                for link, _ in pairs(links) do
                    local _ = link
                end
            end)
        end

        callback({
            nodes = nodes,
            links = links,
        })
    end)
end

return M
