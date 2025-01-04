import { useEffect, useState } from "react"
import { MetaResponse, QueryResult, preview } from "./MediaClient"
import { imgScaler } from "./MetaHandler"

import './Suggestion.css'

interface SuggestionProps {
    doc: QueryResult
    setDoc: (d: QueryResult) => void
}

const Suggestion = ({ doc, setDoc }: SuggestionProps) => {
    const [info, setInfo] = useState<MetaResponse | undefined>(undefined)

    useEffect(() => {
        preview(doc.imdb).then(setInfo)
    }, [doc.imdb])

    return(
        <div className="suggestion" onClick={() => setDoc(doc)}>
            {info?.image && <img src={info.image} alt="Not found" width={0.675*imgScaler} height={1*imgScaler}></img>}
        </div>
    )
}

export default Suggestion