import React, { useContext, useState, useRef, useEffect } from 'react'
import {
  Box,
  Input,
  Tag,
  TagLabel,
  TagCloseButton,
  VStack,
  HStack,
  List,
  ListItem,
  useDisclosure,
} from '@chakra-ui/react'
import { ThemeContext } from '../lib/themecontext'
import { initialFilter } from '../config'

export interface OptionPanelProps {
  options: string[]
  filter: typeof initialFilter
  setFilter: any
  listName: 'tagsBlacklist' | 'tagsWhitelist' | 'dirsAllowlist' | 'dirsBlocklist'
  displayName: string
  labelFilter?: string
}

interface OptionItem {
  value: string
  label: string
}

export const OptionPanel = (props: OptionPanelProps) => {
  const { filter, listName, labelFilter, displayName, setFilter, options = [] } = props
  const { highlightColor } = useContext(ThemeContext)
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const optionArray: OptionItem[] =
    options?.map((option) => {
      return { value: option, label: labelFilter ? option.replace(labelFilter, '') : option }
    }) || []

  const selectedItems: OptionItem[] =
    (filter[listName] as string[])?.map((option) => {
      return {
        value: option,
        label: labelFilter ? option.replace(labelFilter, '') : option,
      }
    }) || []

  const filteredOptions = optionArray.filter(
    (opt) =>
      opt.label.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedItems.find((sel) => sel.value === opt.value),
  )

  const handleSelect = (item: OptionItem) => {
    setFilter({ ...filter, [listName]: [...(filter[listName] as string[]), item.value] })
    setInputValue('')
    setIsOpen(false)
  }

  const handleRemove = (value: string) => {
    setFilter({
      ...filter,
      [listName]: (filter[listName] as string[]).filter((v) => v !== value),
    })
  }

  return (
    <Box>
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={`Add tag to ${displayName}`}
        mt={2}
        height={8}
        fontSize={14}
        fontWeight={300}
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
      <HStack flexWrap="wrap" spacing={1} mt={2}>
        {selectedItems.map((item) => (
          <Tag
            key={item.value}
            size="sm"
            borderColor={highlightColor}
            borderWidth={1}
            borderRadius="md"
            color={highlightColor}
            height={4}
            mb={1}
          >
            <TagLabel fontSize={10}>{item.label}</TagLabel>
            <TagCloseButton onClick={() => handleRemove(item.value)} />
          </Tag>
        ))}
      </HStack>
    </Box>
  )
}
