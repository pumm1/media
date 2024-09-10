import './Selection.css'

interface SelectionProps {
    isChecked: boolean
    option: string
    onClick: (option: string) => void
}

const Selection = ({isChecked, option, onClick, }: SelectionProps) => {
  return (
    <label key={option} className={`pill ${isChecked ? 'selected' : ''}`}>
          <input
            type="checkbox"
            value={option}
            checked={isChecked}
            onChange={() => onClick(option)}
          />
          {option}
        </label>
  );
};

export default Selection