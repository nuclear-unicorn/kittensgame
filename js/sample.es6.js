class SampleES6 {
    foo() {
        let test = 0;
        test++;

        return test;
    }
}

let sample = new SampleES6();
console.log("Sample:", sample.foo());
