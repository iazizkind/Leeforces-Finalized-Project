const mockExecution=async(submissions)=>{
    return submissions.map(()=>({
        status:{
            id:3,
            time:3,
            memory:150,
            description:"Accepted"
        }
    }))
}

module.exports=mockExecution;