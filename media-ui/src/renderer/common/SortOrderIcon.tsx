import sortOrderIcon from './sort-asc-svgrepo-com.svg'

interface SortOrderIconProps {
    className?: string
}
const SortOrderIcon = ({className}: SortOrderIconProps) => 
    <img className={className} src={sortOrderIcon} width={40} height={40}/>

export default SortOrderIcon
