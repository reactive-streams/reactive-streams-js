import { TestSubscriber, Receptacle, AsyncQueue } from '../TestEnvironment';


it("test adds element and complete", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => {
        receptacle.next(1)
        receptacle.terminate();
    }, 10);

    await expect(receptacle.expectNext("Did not receive expected element")).resolves.toEqual(1);
    await expect(receptacle.expectComplete("Did not receive expected stream completion")).resolves.toBeUndefined();
}, 10000);


it("test adds element and async complete", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => {
        receptacle.next(1)
        setTimeout(() => {
            receptacle.terminate();
        }, 10);
    }, 10);

    await expect(receptacle.expectNext("Did not receive expected element")).resolves.toEqual(1);
    await expect(receptacle.expectComplete("Did not receive expected stream completion")).resolves.toBeUndefined();
}, 10000);


it("test adds 5 elements and then allows to wait for all of them in batch", async () => {
    const receptacle = new Receptacle<number>();

    for (let i = 1; i <= 5; i++) {
        const value = i;
        setTimeout(() => {
            receptacle.next(value);
            if (value == 5) {
                setTimeout(() => receptacle.terminate(), 10);
            }
        }, 10 * i);
    }

    await expect(receptacle.expectNextN(5, "Did not receive expected elements")).resolves.toEqual([1, 2, 3, 4, 5]);
    await expect(receptacle.expectComplete("Did not receive expected stream completion")).resolves.toBeUndefined();
}, 10000);

it("test adds 6 elements and then allows to wait for 5 of them in batch then for 1 and for completion", async () => {
    const receptacle = new Receptacle<number>();

    for (let i = 1; i <= 6; i++) {
        const value = i;
        setTimeout(() => {
            receptacle.next(value);
            if (value == 6) {
                setTimeout(() => receptacle.terminate(), 10);
            }
        }, 10 * i);
    }

    await expect(receptacle.expectNextN(5, "Did not receive expected elements")).resolves.toEqual([1, 2, 3, 4, 5]);
    await expect(receptacle.expectNext("Did not receive expected element")).resolves.toEqual(6);
    await expect(receptacle.expectComplete("Did not receive expected stream completion")).resolves.toBeUndefined();
}, 10000);

it("test adds 6 elements and then allows to wait for 1 and then for 5 of them in batch and then for completion", async () => {
    const receptacle = new Receptacle<number>();

    for (let i = 1; i <= 6; i++) {
        const value = i;
        setTimeout(() => {
            receptacle.next(value);
            if (value == 6) {
                setTimeout(() => receptacle.terminate(), 10);
            }
        }, 10 * i);
    }

    await expect(receptacle.expectNext("Did not receive expected element")).resolves.toEqual(1);
    await expect(receptacle.expectNextN(5, "Did not receive expected elements")).resolves.toEqual([2, 3, 4, 5, 6]);
    await expect(receptacle.expectComplete("Did not receive expected stream completion")).resolves.toBeUndefined();
}, 10000);

it("test adds 1 element and then wait for an error", async () => {
    const receptacle = new Receptacle<number>();
    class TestError extends Error {

    }

    setTimeout(() => {
        receptacle.next(1)
        receptacle.error(new TestError());
    }, 10);

    await expect(receptacle.expectNext("Did not receive expected element")).resolves.toEqual(1);
    await expect(receptacle.expectError(TestError, "Did not receive expected stream termination")).resolves.toBeInstanceOf(TestError);
}, 10000);

it("test adds 1 element and then wait for an async error", async () => {
    const receptacle = new Receptacle<number>();
    class TestError extends Error {

    }

    setTimeout(() => {
        receptacle.next(1)
        setTimeout(() => {
            receptacle.error(new TestError());
        }, 10);
    }, 10);

    await expect(receptacle.expectNext("Did not receive expected element")).resolves.toEqual(1);
    await expect(receptacle.expectError(TestError, "Did not receive expected stream termination")).resolves.toBeInstanceOf(TestError);
}, 10000);

it("test expect none should be successful in case no signal appears", async () => {
    const receptacle = new Receptacle<number>();

    await expect(receptacle.expectNone("Received an unexpected call")).resolves.toBeUndefined()
}, 10000);

it("test adds 1 element should cause error when it is expect none", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.next(1);

    await expect(receptacle.expectNone("Expected none")).rejects.toThrowError("Expected none but got next [1]")
}, 10000);

it("test async emission of element should cause error when it is expect none", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => {
        receptacle.next(1);
    }, 10);

    await expect(receptacle.expectNone("Expected none")).rejects.toThrowError("Expected none but got next [1]")
}, 10000);

it("test completion emission should cause error when it is expect none", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.error(new Error("test"));

    await expect(receptacle.expectNone("Expected none")).rejects.toThrowError("Expected none but got error [Error: test]")
}, 10000);

it("test async emission of element should cause error when it is expect none", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => {
        receptacle.error(new Error("test"));
    }, 10);

    await expect(receptacle.expectNone("Expected none")).rejects.toThrowError("Expected none but got error [Error: test]")
}, 10000);

it("test that emission of an unexpected onError signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.error(new Error("test"));

    await expect(receptacle.expectComplete("Expected completion")).rejects.toThrowError(new Error("Expected completion but got error [Error: test]"))
}, 10000);

it("test that async emission of an unexpected onError signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.error(new Error("test")), 10);

    await expect(receptacle.expectComplete("Expected completion")).rejects.toThrowError(new Error("Expected completion but got error [Error: test]"))
}, 10000);

it("test that emission of an unexpected onNext signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.next(1);

    await expect(receptacle.expectComplete("Expected completion")).rejects.toThrowError(new Error("Expected completion but got next [1]"))
}, 10000);

it("test that async emission of unexpected onNext signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.next(1), 10);

    await expect(receptacle.expectComplete("Expected completion")).rejects.toThrowError(new Error("Expected completion but got next [1]"))
}, 10000);

it("test that emission of completion signal should be successful", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.terminate();

    await expect(receptacle.expectComplete("Expected completion")).resolves.toBeUndefined();
}, 10000);

it("test that async emission of completion signal should be successful", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.terminate(), 10);

    await expect(receptacle.expectComplete("Expected completion")).resolves.toBeUndefined();
}, 10000);

it("test that emission of an unexpected onNext signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.next(1);

    await expect(receptacle.expectError(Error, "Expected error of type [Error]")).rejects.toThrowError(new Error("Expected error of type [Error] but got next [1]"))
}, 10000);

it("test that async emission of unexpected onNext signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.next(1), 10)

    await expect(receptacle.expectError(Error, "Expected error of type [Error]")).rejects.toThrowError(new Error("Expected error of type [Error] but got next [1]"))
}, 10000);

it("test that emission of an unexpected onComplete signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.terminate();

    await expect(receptacle.expectError(Error, "Expected error of type [Error]")).rejects.toThrowError(new Error("Expected error of type [Error] but got completion"))
}, 10000);

it("test that async emission of unexpected onComplete signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.terminate(), 10)

    await expect(receptacle.expectError(Error, "Expected error of type [Error]")).rejects.toThrowError(new Error("Expected error of type [Error] but got completion"))
}, 10000);

it("test that emission of expected onError() signal should be successful", async () => {
    const receptacle = new Receptacle<number>();
    class TestError extends Error {

    }

    receptacle.error(new TestError("test"));

    await expect(receptacle.expectError(TestError, "Expected error of type [TestError]")).resolves.toStrictEqual(new TestError("test"));
}, 10000);

it("test that async emission of expected onError() signal should be successful", async () => {
    const receptacle = new Receptacle<number>();
    class TestError extends Error {

    }

    setTimeout(() => receptacle.error(new TestError("test")), 10)

    await expect(receptacle.expectError(TestError, "Expected error of type [TestError]")).resolves.toStrictEqual(new TestError("test"));
}, 10000);

it("test that no signals should timeout for next expectation", async () => {
    const receptacle = new Receptacle<number>();

    await expect(receptacle.expectError(Error, "Expected error of type [Error]", 100)).rejects.toThrowError(new Error("Expected error of type [Error] within 100 ms but timed out"));
}, 10000);

it("test that emission of unexpected onComplete signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.terminate(), 10)

    await expect(receptacle.expectNext("Expected next element")).rejects.toThrowError(new Error("Expected next element but got completion"))
}, 10000);

it("test that emission of unexpected onComplete signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.terminate();

    await expect(receptacle.expectNext("Expected next element")).rejects.toThrowError(new Error("Expected next element but got completion"))
}, 10000);

it("test emission of unexpected onError signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.error(new Error("test")), 10)

    await expect(receptacle.expectNext("Expected next element")).rejects.toThrowError(new Error("Expected next element but got error [Error: test]"))
}, 10000);

it("test emission of unexpected onError signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.error(new Error("test")), 10)

    await expect(receptacle.expectNext("Expected next element")).rejects.toThrowError(new Error("Expected next element but got error [Error: test]"))
}, 10000);

it("test that async emission of unexpected onError signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.error(new Error("test"));

    await expect(receptacle.expectNext("Expected next element")).rejects.toThrowError(new Error("Expected next element but got error [Error: test]"))
}, 10000);

it("test that no signals should timeout for next expectation", async () => {
    const receptacle = new Receptacle<number>();

    await expect(receptacle.expectNext("Expected next element", 100)).rejects.toThrowError(new Error("Expected next element within 100 ms but timed out"));
}, 10000);

it("test that emission of onNext should result with element in case of next or end of stream expectation", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.next(1);

    await expect(receptacle.expectNextOrComplete("Did not receive expected")).resolves.toBe(1);
});

it("test that async emission of onNext should result with element in case of next or end of stream expectation", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.next(1), 10);

    await expect(receptacle.expectNextOrComplete("Did not receive expected")).resolves.toBe(1);
});

it("test that emission of onComplete should result with element in case of next or end of stream expectation", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.terminate();

    await expect(receptacle.expectNextOrComplete("Did not receive expected")).resolves.toBeUndefined();
});

it("test that async emission of onNext should result with element in case of next or end of stream expectation", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.terminate(), 10);

    await expect(receptacle.expectNextOrComplete("Did not receive expected")).resolves.toBeUndefined();
});

it("test that emission of onError should result with element in case of next or end of stream expectation", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.error(new Error("test"));

    await expect(receptacle.expectNextOrComplete("Expected next element or completion")).rejects.toStrictEqual(new Error("Expected next element or completion but got error [Error: test]"));
});

it("test that async emission of onError should result with element in case of next or end of stream expectation", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.error(new Error("test")), 10);

    await expect(receptacle.expectNextOrComplete("Expected next element or completion")).rejects.toStrictEqual(new Error("Expected next element or completion but got error [Error: test]"));
});

it("test that no signals should timeout for next or end of stream expectation", async () => {
    const receptacle = new Receptacle<number>();

    await expect(receptacle.expectNextOrComplete("Expected next element or completion", 100)).rejects.toThrowError("Expected next element or completion within 100 ms but timed out");
});

it("test that add after termination should fail", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.terminate();
    receptacle.next(1);

    await expect(receptacle.expectComplete()).resolves.toBeUndefined();
    await expect(receptacle.expectError(Error, "Expected error of type Error")).resolves.toStrictEqual(new Error("Emitted unexpected next [1] after Terminal signal"))
}, 10000);

it("test that add after termination should fail", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.terminate();
    receptacle.next(1);

    await expect(receptacle.expectComplete()).resolves.toBeUndefined();
    await expect(receptacle.expectError(Error, "Expected error of type Error")).resolves.toStrictEqual(new Error("Emitted unexpected next [1] after Terminal signal"))
}, 10000);

it("test that double termination should fail", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.terminate();
    receptacle.terminate();

    await expect(receptacle.expectComplete()).resolves.toBeUndefined();
    await expect(receptacle.expectError(Error, "Expected error of type Error")).resolves.toStrictEqual(new Error("Emitted termination more than once"));
}, 10000);