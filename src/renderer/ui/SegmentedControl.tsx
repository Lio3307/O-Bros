interface SegmentedOption<Value> {
  value: Value
  label: string
}

interface SegmentedControlProps<Value> {
  options: SegmentedOption<Value>[]
  value: Value
  onChange: (value: Value) => void
  className?: string
  disabled?: boolean
}

export function SegmentedControl<Value extends string | number>({
  options,
  value,
  onChange,
  className,
  disabled = false
}: SegmentedControlProps<Value>) {
  const classNames = className === undefined ? 'segmented' : `segmented ${className}`
  return (
    <div className={classNames}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          className={option.value === value ? 'segment segment-active' : 'segment'}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
