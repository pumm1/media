import './Selection.css'

interface SelectionProps {
    isChecked: boolean
    option: string
    onClick: (option: string) => void
}

type PillVariant = 'Static' | 'Dynamic'

interface PillProps {
  variant: PillVariant
  keyProp: string
  children: any
  isChecked?: boolean
}

export const Pill = ({ keyProp, children, isChecked, variant }: PillProps) => 
  <label key={keyProp} className={variant === 'Dynamic' ? `pill ${isChecked ? 'selected' : ''}` : 'staticHighlightPill'}>
    {children}
  </label>

const Selection = ({isChecked, option, onClick, }: SelectionProps) => {
  return (
      <Pill variant='Dynamic' keyProp={option} isChecked={isChecked}>
          <input
            type="checkbox"
            value={option}
            checked={isChecked}
            onChange={() => onClick(option)}
          />
          {option}
      </Pill>
  )
}

export default Selection