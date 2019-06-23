import { TestSubscriber, Receptacle } from '../TestEnvironment';

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
        receptacle.terminate(new TestError());
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
            receptacle.terminate(new TestError());
        }, 10);
    }, 10);

    await expect(receptacle.expectNext("Did not receive expected element")).resolves.toEqual(1);
    await expect(receptacle.expectError(TestError, "Did not receive expected stream termination")).resolves.toBeInstanceOf(TestError);
}, 10000);

it("test adds 1 element and then wait for an async error", async () => {
    const receptacle = new Receptacle<number>();

    await expect(receptacle.expectNone("Received an unexpected call")).resolves.toBeUndefined()
}, 10000);

it("test that emission of an unexpected onError signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.terminate(new Error("test"));

    await expect(receptacle.expectComplete("Did not receive expected stream completion")).rejects.toThrowError(new Error("Expected completion but got error [Error: test]"))
}, 10000);

it("test that async emission of an unexpected onError signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.terminate(new Error("test")), 10);

    await expect(receptacle.expectComplete("Did not receive expected stream completion")).rejects.toThrowError(new Error("Expected completion but got error [Error: test]"))
}, 10000);

it("test that emission of an unexpected onNext signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.next(1);

    await expect(receptacle.expectComplete("Did not receive expected stream completion")).rejects.toThrowError(new Error("Expected the end of the stream but got elements [1]"))
}, 10000);

it("test that async emission of unexpected onNext signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.next(1), 10)

    await expect(receptacle.expectComplete("Did not receive expected stream completion")).rejects.toThrowError(new Error("Received unexpected onNext call [1]"))
}, 10000);

it("test that emission of an unexpected onNext signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    receptacle.next(1);

    await expect(receptacle.expectError(Error, "Did not receive expected stream termination")).rejects.toThrowError(new Error("Expected the end of the stream but got elements [1]"))
}, 10000);

it("test that async emission of unexpected onNext signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.next(1), 10)

    await expect(receptacle.expectError(Error, "Did not receive expected stream termination")).rejects.toThrowError(new Error("Received unexpected onNext call [1]"))
}, 10000);

it("test that emission of unexpected onComplete signal should result with error", async () => {
    const receptacle = new Receptacle<number>();

    setTimeout(() => receptacle.terminate(), 10)

    await expect(receptacle.expectNext("Did not receive expected stream completion")).rejects.toThrowError(new Error("Expected next element but got completion"))
}, 10000);

it("test that add after termination should fail", async () => {
    const receptacle = new Receptacle<number>();
    const realFail = fail;
    const mockFail = jest.fn();
    globalThis.fail = mockFail as any;

    receptacle.terminate();
    receptacle.next(1);

    globalThis.fail = realFail;
    await expect(mockFail.mock.calls.length).toBe(1)
    await expect(mockFail.mock.calls[0][0]).toBe("Emitted unexpected next after Terminal signal")
}, 10000);

it("test that add after termination should fail", async () => {
    const receptacle = new Receptacle<number>();
    const realFail = fail;
    const mockFail = jest.fn();
    globalThis.fail = mockFail as any;

    receptacle.terminate();
    receptacle.next(1);

    globalThis.fail = realFail;
    await expect(mockFail.mock.calls.length).toBe(1)
    await expect(mockFail.mock.calls[0][0]).toBe("Emitted unexpected next after Terminal signal")
}, 10000);

it("test that double termination should fail", async () => {
    const receptacle = new Receptacle<number>();
    const realFail = fail;
    const mockFail = jest.fn();
    globalThis.fail = mockFail as any;

    receptacle.terminate();
    receptacle.terminate(new Error("test"));

    globalThis.fail = realFail;
    await expect(mockFail.mock.calls.length).toBe(1)
    await expect(mockFail.mock.calls[0][0]).toBe("Emitted Terminal signal twice")
}, 10000);