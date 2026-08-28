const axios=require("axios")
const getLanguageById = (lang) => {

    const language = {
        "c++": 73,
        "java": 63,
        "javascript": 64
    };

    return language[lang.toLowerCase()];
};

const waiting=async(timer)=>{
    setInterval(()=>{
        return 1;
    },timer)
};

const SubmitBatch=async (submission)=>{
   

    const options = {
    method: 'GET',
    url: 'https://judge0-ce.p.rapidapi.com/about',
    headers: {
        'x-rapidapi-key': '98e8d95bedmsh2166f50c22d16d7p14739ajsn9cfbb5274258',
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
        'Content-Type': 'application/json'
    },
    data:{
        submission
    }
    };


    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;

        } catch (error) {
            console.error(error);
        }
    }

    return await fetchData();

}

const getResultbyToken=async(result)=>{

    const options = {
    method: 'GET',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
        tokens: result.join(","),
        base64_encoded: 'true',
        fields: '*'
    },
    headers: {
        'x-rapidapi-key': '98e8d95bedmsh2166f50c22d16d7p14739ajsn9cfbb5274258',
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
        'Content-Type': 'application/json'
    }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    while(true){
        const result=await fetchData();

        const isResultObtained=result.every((r)=>r.status_id>3);
        if(isResultObtained){
            return result.submission;
        }
        waiting(1000);
    }
}
    

module.exports = {getLanguageById,SubmitBatch,getResultbyToken};