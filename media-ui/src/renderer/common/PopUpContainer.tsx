import './PopUpContainer.css'

interface PopUpContainerProps {
    children: any
}

const PopUpContainer = ({children}: PopUpContainerProps) => 
    <div className='popUpContainer'>
        {children}
    </div>

export default PopUpContainer