local M = {}

local function get_roam()
  local ok, roam = pcall(require, "org-roam")
  if not ok then
    ok, roam = pcall(require, "orgroam")
  end
  return ok and roam
end

function M.get_roam_directory()
  local roam = get_roam()
  if roam and roam.config and roam.config.defaults then
    return roam.config.defaults.directory or vim.g.org_roam_directory
  end
  return vim.g.org_roam_directory or vim.fn.expand("~/org")
end

function M.get_all_nodes()
  local roam = get_roam()
  if not roam then
    vim.notify("org-roam.nvim not found", vim.log.levels.ERROR)
    return { nodes = {}, links = {}, tags = {} }
  end

  local nodes = {}
  local all_tags = {}
  local node_map = {}

  local database = roam.database or (roam.core and roam.core.database)
  if not database then
    return { nodes = {}, tags = {} }
  end

  local files = database:files()
  if not files or not files._value or not files._value._values then
    return { nodes = {}, tags = {} }
  end

  local files_data = files._value._values
  local all_files = files_data[1] and files_data[1].all_files or {}
  
  for file_path, file_data in pairs(all_files) do
    local headlines = {}
    if file_data.get_headlines then
      headlines = file_data:get_headlines() or {}
    elseif file_data.headlines then
      headlines = file_data.headlines
    end

    for _, headline in ipairs(headlines) do
      local tags = {}
      if headline.get_tags then
        tags = headline:get_tags() or {}
      elseif headline.tags then
        tags = headline.tags
      end
      
      for _, tag in ipairs(tags) do
        all_tags[tag] = true
      end

      local title = ""
      if headline.get_title then
        title = headline:get_title() or ""
      elseif headline.get_node_text then
        title = headline:get_node_text() or ""
      elseif headline.title then
        title = headline.title
      elseif headline.raw_title then
        title = headline.raw_title
      end

      local node_id = ""
      local headline_props = {}
      if headline.get_properties then
        headline_props = headline:get_properties() or {}
      elseif headline.properties then
        headline_props = headline.properties or {}
      end
      
      if headline.get_property then
        node_id = headline:get_property("ID") or ""
      elseif headline_props and headline_props.ID then
        node_id = headline_props.ID
      end

      local level = 0
      if headline.get_level then
        level = headline:get_level()
      elseif headline.level then
        level = headline.level
      end

      local pos = 0
      if headline.pos then
        pos = headline.pos
      end

      local olp = nil
      if headline.get_outline_path then
        olp = headline:get_outline_path()
      elseif headline.olp then
        olp = headline.olp
      end

      if node_id == "" then
        node_id = file_path .. "::" .. (title or "")
      end

      local processed_node = {
        id = node_id,
        file = file_path,
        title = title,
        level = level,
        pos = pos,
        properties = headline_props,
        tags = tags,
        olp = olp,
      }

      -- Only include headlines that have an ID (org-roam nodes)
      -- or headlines that are explicitly linked to
      if node_id and node_id ~= "" and (headline_props.id or headline_props.ID) then
        node_map[node_id] = processed_node
        table.insert(nodes, processed_node)
      end
    end

    -- Add file-level node (always included)
    local file_title = file_path:match("([^/]+)$") or file_path
    local file_id = file_path
    local file_node = {
      id = file_id,
      file = file_path,
      title = file_title,
      level = 0,
      pos = 0,
      properties = {},
      tags = {},
      olp = nil,
    }
    table.insert(nodes, file_node)
    node_map[file_id] = file_node

    local file_tags = {}
    if file_data.get_filetags then
      file_tags = file_data:get_filetags() or {}
    end
    for _, tag in ipairs(file_tags) do
      all_tags[tag] = true
    end
  end

  return {
    nodes = nodes,
    tags = vim.tbl_keys(all_tags),
  }
end

function M.get_links()
  local roam = get_roam()
  if not roam then
    return {}
  end

  local links = {}
  local database = roam.database or (roam.core and roam.core.database)
  if not database then
    return {}
  end

  local files = database:files()
  if not files or not files._value or not files._value._values then
    return {}
  end

  local files_data = files._value._values
  local all_files = files_data[1] and files_data[1].all_files or {}

  for file_path, file_data in pairs(all_files) do
    local file_id = file_path
    
    local links_data = {}
    if file_data.get_links then
      links_data = file_data:get_links() or {}
    elseif file_data.links then
      links_data = file_data.links
    end

    for _, link in ipairs(links_data) do
      local target_id = ""
      local link_type = "id"
      
      if link.url then
        local url = link.url
        if url.get_protocol then
          link_type = url:get_protocol() or "id"
        elseif url.protocol then
          link_type = url.protocol
        end
        
        if url.get_target then
          target_id = url:get_target() or ""
        elseif url.get_id then
          target_id = url:get_id() or ""
        elseif url.path then
          target_id = url.path
        elseif url.target then
          target_id = url.target
        end
        
        if link_type == "id" and target_id == "" then
          target_id = url.path or ""
        elseif link_type == "heading" and target_id == "" then
          target_id = file_path .. "::" .. (link.heading or "")
        elseif link_type == "file" and target_id == "" then
          target_id = url.path or ""
        end
      else
        target_id = link.target or ""
        if link.type == "id" and link.id then
          target_id = link.id
        elseif link.type == "heading" and link.heading then
          target_id = file_path .. "::" .. link.heading
        elseif link.type == "file" and link.path then
          target_id = link.path
        end
        link_type = link.type or "id"
      end

      if target_id ~= "" then
        table.insert(links, {
          source = file_id,
          target = target_id,
          type = link_type,
        })
      end
    end
  end

  return links
end

function M.get_graph_data()
  local nodes_data = M.get_all_nodes()
  local links = M.get_links()

  return {
    nodes = nodes_data.nodes,
    links = links,
    tags = nodes_data.tags,
  }
end

return M