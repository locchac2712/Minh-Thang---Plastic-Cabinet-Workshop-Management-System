import { Button, DatePicker, Input, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import type { ComponentPropsWithoutRef } from 'react'

type InputProps = Omit<ComponentPropsWithoutRef<typeof Input>, 'onChange' | 'size'> & {
  onChangeValue?: (next: string) => void
}

type Option = {
  value: string
  label: string
}

type SelectProps = {
  value?: string
  options: Option[]
  placeholder?: string
  onChangeValue?: (value: string) => void
  allowClear?: boolean
}

type DateProps = {
  value?: Dayjs | null
  placeholder?: string
  onChangeValue?: (value: Dayjs | null) => void
}

export function AppFilterInput({ onChangeValue, ...rest }: InputProps) {
  return (
    <Input
      {...rest}
      allowClear
      prefix={<SearchOutlined />}
      onChange={(event) => onChangeValue?.(event.target.value)}
    />
  )
}

export function AppFilterSelect({
  value,
  options,
  placeholder,
  onChangeValue,
  allowClear = false,
}: SelectProps) {
  return (
    <Select
      value={value}
      options={options}
      placeholder={placeholder}
      onChange={(next) => onChangeValue?.(next)}
      allowClear={allowClear}
    />
  )
}

export function AppFilterDate({ value, placeholder, onChangeValue }: DateProps) {
  return (
    <DatePicker
      value={value}
      format="DD/MM/YYYY"
      placeholder={placeholder}
      onChange={(next) => onChangeValue?.(next)}
    />
  )
}

type ClearButtonProps = {
  onClick: () => void
  children?: string
}

export function AppFilterClearButton({ onClick, children = 'Xóa lọc' }: ClearButtonProps) {
  return (
    <Button onClick={onClick}>
      {children}
    </Button>
  )
}
