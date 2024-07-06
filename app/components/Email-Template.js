import React from 'react'

const EmailTemplate = ({firstName}) => {
  return (
    <div>
        <h1 >welcome, {firstName}</h1>
        <h1 >you just pa for a ticket and this is a test!</h1>
    </div>
  )
}

export default EmailTemplate