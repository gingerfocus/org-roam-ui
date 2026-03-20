import { DeleteIcon } from '@chakra-ui/icons'
import {
  Text,
  Box,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  StackDivider,
  VStack,
  Button,
  Input,
  List,
  ListItem,
} from '@chakra-ui/react'
import React, { useState, useRef, useEffect } from 'react'
import { TagColors } from '../../config'

export interface TagColorPanelProps {
  tags: string[]
  highlightColor: string
  colorList: string[]
  tagColors: TagColors
  setTagColors: any
}

interface OptionItem {
  value: string
  label: string
}

export const TagColorPanel = (props: TagColorPanelProps) => {
  const { colorList, tagColors, setTagColors, highlightColor, tags } = props
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const tagArray: OptionItem[] = tags.map((tag) => {
    return { value: tag, label: tag }
  })

  const selectedItems: OptionItem[] = Object.keys(tagColors).map((tag) => {
    return { value: tag, label: tag }
  })

  const filteredOptions = tagArray.filter(
    (opt) =>
      opt.label.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedItems.find((sel) => sel.value === opt.value),
  )

  const handleSelect = (item: OptionItem) => {
    setTagColors({
      ...tagColors,
      [item.label]: tagColors[item.label] ?? 'gray.600',
    })
    setInputValue('')
    setIsOpen(false)
  }

  return (
    <Box position="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder="Add tag to color"
        height={8}
        fontWeight={300}
        fontSize={14}
        focusBorderColor={highlightColor}
        borderColor="gray.500"
      />
      {isOpen && filteredOptions.length > 0 && (
        <List
          position="absolute"
          zIndex={10}
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          maxH="200px"
          overflowY="auto"
          boxShadow="md"
          w="100%"
        >
          {filteredOptions.slice(0, 10).map((item) => (
            <ListItem
              key={item.value}
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: 'gray.100' }}
              onClick={() => handleSelect(item)}
            >
              {item.label}
            </ListItem>
          ))}
        </List>
      )}
      <VStack
        spacing={2}
        justifyContent="flex-start"
        divider={<StackDivider borderColor="gray.500" />}
        align="stretch"
        color="gray.800"
      >
        {Object.keys(tagColors).map((tag) => {
          return (
            <Flex key={tag} alignItems="center" justifyContent="space-between" width="100%" pl={2}>
              <Box width="100%">
                <Text>{tag}</Text>
              </Box>
              <Menu isLazy placement="right">
                <MenuButton as={Button} colorScheme="" color="black">
                  {<Box bgColor={tagColors[tag]} borderRadius="sm" height={6} width={6}></Box>}
                </MenuButton>
                <Portal>
                  <MenuList minW={10} zIndex="popover" bgColor="gray.200">
                    {colorList.map((color: string) => (
                      <MenuItem
                        key={color}
                        onClick={() =>
                          setTagColors({
                            ...tagColors,
                            [tag]: color,
                          })
                        }
                        justifyContent="space-between"
                        alignItems="center"
                        display="flex"
                      >
                        <Box bgColor={color} borderRadius="sm" height={6} width={6}></Box>
                      </MenuItem>
                    ))}
                  </MenuList>
                </Portal>
              </Menu>
              <IconButton
                aria-label="Delete tag color"
                variant="ghost"
                icon={<DeleteIcon />}
                onClick={() => {
                  const newTagColors = { ...tagColors }
                  delete newTagColors[tag]
                  setTagColors(newTagColors)
                }}
              />
            </Flex>
          )
        })}
      </VStack>
    </Box>
  )
}
